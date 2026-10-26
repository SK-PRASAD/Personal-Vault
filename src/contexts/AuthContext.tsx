import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

import { supabase, isConfigured } from "../lib/supabase";
import type { Member, MemberStatus } from "../lib/types";

type UserRole = "anonymous" | "member" | "admin";

interface AuthState {
  user: any | null;
  role: UserRole;
  member: Member | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string
  ) => Promise<{ error?: string }>;

  signup: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error?: string }>;

  adminLogin: (
    email: string,
    password: string
  ) => Promise<{ error?: string }>;

  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/* -------------------------------------------------------
   LOAD MEMBER PROFILE
------------------------------------------------------- */

async function loadProfile(
  userId: string,
  email = ""
): Promise<Member | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Profile load failed:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const { data: permissions, error: permissionsError } =
    await supabase
      .from("item_permissions")
      .select("item_id")
      .eq("user_id", userId);

  if (permissionsError) {
    console.error(
      "Permission load failed:",
      permissionsError
    );
  }

  return {
    id: userId,
    email,
    name: data.display_name || "",
    status: data.status as MemberStatus,
    permissions: permissions?.length
      ? ["view"]
      : ["view"],
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/* -------------------------------------------------------
   CHECK ADMIN
------------------------------------------------------- */

async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Admin check failed:", error);
    return false;
  }

  return Boolean(data);
}

/* -------------------------------------------------------
   AUTH PROVIDER
------------------------------------------------------- */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: "anonymous",
    member: null,
    loading: true,
  });

  /* -----------------------------------------------------
     REFRESH SESSION
  ----------------------------------------------------- */

  const refreshSession = useCallback(async () => {
    if (!isConfigured) {
      setState((current) => ({
        ...current,
        loading: false,
      }));

      return;
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error(
        "Session error:",
        error
      );
    }

    /* No active session */
    if (!session?.user) {
      setState({
        user: null,
        role: "anonymous",
        member: null,
        loading: false,
      });

      return;
    }

    const currentUser = session.user;

    /* ---------------------------------------------------
       ADMIN CHECK
    --------------------------------------------------- */

    const admin = await isAdmin(
      currentUser.id
    );

    if (admin) {
      setState({
        user: currentUser,
        role: "admin",
        member: null,
        loading: false,
      });

      return;
    }

    /* ---------------------------------------------------
       MEMBER PROFILE
    --------------------------------------------------- */

    const member = await loadProfile(
      currentUser.id,
      currentUser.email || ""
    );

    setState({
      user: currentUser,
      role: "member",
      member,
      loading: false,
    });
  }, []);

  /* -----------------------------------------------------
     INITIAL SESSION + AUTH LISTENER
  ----------------------------------------------------- */

  useEffect(() => {
    void refreshSession();

    if (!isConfigured) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, _session) => {
        /*
         * Do not perform heavy Supabase queries directly
         * inside the auth callback.
         */
        setTimeout(() => {
          void refreshSession();
        }, 0);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  /* -----------------------------------------------------
     MEMBER LOGIN
  ----------------------------------------------------- */

  const login = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    if (!isConfigured) {
      return {
        error: "Supabase is not configured.",
      };
    }

    const cleanEmail = email
      .trim()
      .toLowerCase();

    if (!cleanEmail || !password) {
      return {
        error:
          "Please enter your email and password.",
      };
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (error) {
      return {
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        error: "Login failed.",
      };
    }

    /* ---------------------------------------------------
       ADMIN MUST USE ADMIN LOGIN
    --------------------------------------------------- */

    const admin = await isAdmin(
      data.user.id
    );

    if (admin) {
      await supabase.auth.signOut();

      return {
        error:
          "Use Admin Login for administrator access.",
      };
    }

    /* ---------------------------------------------------
       LOAD MEMBER PROFILE
    --------------------------------------------------- */

    const profile = await loadProfile(
      data.user.id,
      data.user.email || cleanEmail
    );

    if (!profile) {
      await supabase.auth.signOut();

      return {
        error:
          "Your member profile is not ready yet. Please wait for admin approval.",
      };
    }

    /* ---------------------------------------------------
       STATUS CHECK
    --------------------------------------------------- */

    if (profile.status === "pending") {
      await supabase.auth.signOut();

      return {
        error:
          "Your account is pending admin approval.",
      };
    }

    if (profile.status === "rejected") {
      await supabase.auth.signOut();

      return {
        error:
          "Your account has been rejected by the administrator.",
      };
    }

    if (profile.status === "suspended") {
      await supabase.auth.signOut();

      return {
        error:
          "Your account has been suspended.",
      };
    }

    if (profile.status !== "approved") {
      await supabase.auth.signOut();

      return {
        error:
          `Account status: ${profile.status}.`,
      };
    }

    /* ---------------------------------------------------
       APPROVED
    --------------------------------------------------- */

    await refreshSession();

    return {};
  };

  /* -----------------------------------------------------
     MEMBER SIGNUP
  ----------------------------------------------------- */

  const signup = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ error?: string }> => {
    if (!isConfigured) {
      return {
        error: "Supabase is not configured.",
      };
    }

    const cleanEmail = email
      .trim()
      .toLowerCase();

    const cleanName = name.trim();

    if (!cleanEmail) {
      return {
        error:
          "Please enter your email address.",
      };
    }

    if (!cleanName) {
      return {
        error: "Please enter your name.",
      };
    }

    if (password.length < 6) {
      return {
        error:
          "Password must be at least 6 characters.",
      };
    }

    /* ---------------------------------------------------
       CREATE SUPABASE AUTH USER

       No emailRedirectTo.
       No /verify-email flow.
       Admin approval controls access.
    --------------------------------------------------- */

    const { data, error } =
      await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: cleanName,
          },
        },
      });

    if (error) {
      console.error(
        "Signup failed:",
        error
      );

      return {
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        error:
          "Account creation failed.",
      };
    }

    /* ---------------------------------------------------
       CREATE / UPDATE MEMBER PROFILE

       Database RLS allows the authenticated user
       to create their own profile.
    --------------------------------------------------- */

    const { error: profileError } =
      await supabase
        .from("profiles")
        .upsert(
          {
            user_id: data.user.id,
            display_name: cleanName,
            status: "pending",
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

    if (profileError) {
      console.error(
        "Profile creation failed:",
        profileError
      );

      await supabase.auth.signOut();

      return {
        error:
          "Account created, but your member profile could not be created. Please contact the administrator.",
      };
    }

    /* ---------------------------------------------------
       SIGNUP COMPLETE

       Account remains pending until admin approves.
    --------------------------------------------------- */

    await supabase.auth.signOut();

    return {};
  };

  /* -----------------------------------------------------
     ADMIN LOGIN
  ----------------------------------------------------- */

  const adminLogin = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    if (!isConfigured) {
      return {
        error:
          "Supabase is not configured.",
      };
    }

    const cleanEmail = email
      .trim()
      .toLowerCase();

    if (!cleanEmail || !password) {
      return {
        error:
          "Please enter your admin email and password.",
      };
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (error) {
      return {
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        error: "Login failed.",
      };
    }

    /* ---------------------------------------------------
       ADMIN TABLE CHECK
    --------------------------------------------------- */

    const admin = await isAdmin(
      data.user.id
    );

    if (!admin) {
      await supabase.auth.signOut();

      return {
        error:
          "Access denied. Admin privileges required.",
      };
    }

    await refreshSession();

    return {};
  };

  /* -----------------------------------------------------
     LOGOUT
  ----------------------------------------------------- */

  const logout = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    }

    setState({
      user: null,
      role: "anonymous",
      member: null,
      loading: false,
    });
  };

  /* -----------------------------------------------------
     PROVIDER
  ----------------------------------------------------- */

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        adminLogin,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* -------------------------------------------------------
   USE AUTH
------------------------------------------------------- */

export function useAuth() {
  const context = useContext(
    AuthContext
  );

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
}