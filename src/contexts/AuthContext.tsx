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

async function loadProfile(
  userId: string,
  email = ""
): Promise<Member | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const { data: permissions } = await supabase
    .from("item_permissions")
    .select("item_id")
    .eq("user_id", userId);

  return {
    id: userId,
    email,
    name: data.display_name || "",
    status: data.status as MemberStatus,
    permissions: permissions?.length ? ["view"] : ["view"],
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

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
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setState({
        user: null,
        role: "anonymous",
        member: null,
        loading: false,
      });
      return;
    }

    const admin = await isAdmin(session.user.id);

    if (admin) {
      setState({
        user: session.user,
        role: "admin",
        member: null,
        loading: false,
      });
      return;
    }

    const member = await loadProfile(
      session.user.id,
      session.user.email || ""
    );

    setState({
      user: session.user,
      role: "member",
      member,
      loading: false,
    });
  }, []);

  useEffect(() => {
    void refreshSession();

    if (!isConfigured) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    if (!isConfigured) {
      return {
        error: "Supabase is not configured.",
      };
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
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

    if (await isAdmin(data.user.id)) {
      await supabase.auth.signOut();

      return {
        error:
          "Use Admin Login for administrator access.",
      };
    }

    const profile = await loadProfile(
      data.user.id,
      data.user.email || email
    );

    if (!profile) {
      await supabase.auth.signOut();

      return {
        error:
          "Your member profile is not ready yet. Please wait for admin approval.",
      };
    }

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
        error: `Account status: ${profile.status}.`,
      };
    }

    await refreshSession();

    return {};
  };

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

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail) {
      return {
        error: "Please enter your email address.",
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

    const { data, error } =
      await supabase.auth.signUp({
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
        error: "Account creation failed.",
      };
    }

    /*
     * Important:
     *
     * The existing database has RLS enabled on profiles.
     * We intentionally do NOT bypass RLS or use a service-role
     * key in the browser.
     *
     * Try the existing profile policy first.
     */
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: data.user.id,
          display_name: cleanName,
          status: "pending",
        },
        {
          onConflict: "user_id",
        }
      );

    /*
     * If the existing RLS policy rejects the profile insert,
     * the Auth account itself was still created successfully.
     *
     * Do not expose a misleading "Supabase is not configured"
     * message and do not use unsafe client-side credentials.
     */
    if (profileError) {
      console.warn(
        "Profile creation was blocked by the existing RLS policy:",
        profileError.message
      );

      await supabase.auth.signOut();

      return {
        error:
          "Account created, but your member profile could not be created because of the current database permissions. Please contact the administrator.",
      };
    }

    await supabase.auth.signOut();

    return {};
  };

  const adminLogin = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    if (!isConfigured) {
      return {
        error: "Supabase is not configured.",
      };
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
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

    const admin = await isAdmin(data.user.id);

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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
}