import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { AdminLayout } from '../components/Layout';
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassTextarea,
  GlassSelect,
  Badge,
  Modal,
  EmptyState,
  ConfirmDialog,
} from '../components/ui';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Users,
  FolderOpen,
  Globe,
  EyeOff,
  Lock,
  Clock,
  Activity,
  Check,
  X,
  Copy,
} from 'lucide-react';
import type {
  VaultItem,
  Visibility,
  ItemType,
  MemberStatus,
  ActivityLog,
} from '../lib/types';

const emptyItem = {
  title: '',
  description: '',
  type: 'link' as ItemType,
  visibility: 'public' as Visibility,
  url: '',
  content: '',
  tags: '',
  file_path: '',
  file_name: '',
  file_size: 0,
  file_type: '',
};

async function log(
  action: string,
  actor: string,
  extra: Record<string, unknown> = {}
) {
  await supabase.from('activity_logs').insert({
    actor_user_id: actor,
    action,
    item_id: (extra.item_id as string) || null,
    target_user_id: (extra.target_user_id as string) || null,
    metadata: extra,
  });
}

function ItemModal({
  open,
  onClose,
  item,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  item: VaultItem | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<any>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [allowed, setAllowed] = useState<string[]>([]);

  useEffect(() => {
    if (item) {
      setForm({
        ...emptyItem,
        ...item,
        tags: (item.tags || []).join(','),
      });
    } else {
      setForm({ ...emptyItem });
    }

    if (open) {
      void supabase
        .from('profiles')
        .select('user_id,display_name,status')
        .eq('status', 'approved')
        .then(({ data }) => {
          setMembers(data || []);
        });
    }

    if (open && item) {
      void supabase
        .from('item_permissions')
        .select('user_id')
        .eq('item_id', item.id)
        .then(({ data }) => {
          setAllowed((data || []).map((x: any) => x.user_id));
        });
    } else if (open && !item) {
      setAllowed([]);
    }
  }, [open, item]);

  const set = (key: string, value: any) => {
    setForm((current: any) => ({
      ...current,
      [key]: value,
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setSaving(true);

    try {
      let fileMeta: any = {};

      if (file) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;

        const { error } = await supabase.storage
          .from('vault-files')
          .upload(path, file, {
            upsert: false,
          });

        if (error) throw error;

        fileMeta = {
          file_path: path,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
        };
      }

      const payload = {
        title: form.title,
        description: form.description || null,
        type: form.type,
        visibility: form.visibility,
        url: form.url || null,
        content: form.content || null,
        tags: String(form.tags || '')
          .split(',')
          .map((x: string) => x.trim())
          .filter(Boolean),
        is_favorite: item?.is_favorite || false,
        ...fileMeta,
      };

      let id = item?.id;

      if (item) {
        const { error } = await supabase
          .from('vault_items')
          .update(payload)
          .eq('id', item.id);

        if (error) throw error;

        await log('item_edited', user.id, {
          item_id: item.id,
          title: form.title,
        });
      } else {
        const { data, error } = await supabase
          .from('vault_items')
          .insert({
            ...payload,
            user_id: user.id,
          })
          .select('id')
          .single();

        if (error) throw error;

        id = data.id;

        await log('item_created', user.id, {
          item_id: id,
          title: form.title,
        });
      }

      if (id) {
        await supabase
          .from('item_permissions')
          .delete()
          .eq('item_id', id);

        if (form.visibility === 'private' && allowed.length) {
          const { error } = await supabase
            .from('item_permissions')
            .insert(
              allowed.map((user_id) => ({
                item_id: id,
                user_id,
              }))
            );

          if (error) throw error;
        }
      }

      toast(item ? 'Item updated' : 'Item created', 'success');

      onSaved();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Could not save item', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? 'Edit item' : 'Add item'}
      maxWidth="xl"
    >
      <form
        onSubmit={save}
        className="space-y-4 max-h-[75vh] overflow-y-auto pr-1"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <GlassInput
            label="Title"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />

          <GlassSelect
            label="Type"
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            options={['link', 'video', 'note', 'file'].map((value) => ({
              value,
              label: value,
            }))}
          />
        </div>

        <GlassTextarea
          label="Description"
          value={form.description || ''}
          onChange={(e) => set('description', e.target.value)}
        />

        <GlassSelect
          label="Visibility"
          value={form.visibility}
          onChange={(e) => set('visibility', e.target.value)}
          options={[
            ['public', 'Public'],
            ['unlisted', 'Unlisted'],
            ['private', 'Private'],
          ].map(([value, label]) => ({
            value,
            label,
          }))}
        />

        {form.type !== 'note' && (
          <GlassInput
            label={
              form.type === 'file'
                ? 'External URL (optional)'
                : 'URL'
            }
            value={form.url || ''}
            onChange={(e) => set('url', e.target.value)}
          />
        )}

        {form.type === 'note' && (
          <GlassTextarea
            label="Note content"
            value={form.content || ''}
            onChange={(e) => set('content', e.target.value)}
          />
        )}

        <GlassInput
          label="Tags (comma separated)"
          value={form.tags || ''}
          onChange={(e) => set('tags', e.target.value)}
        />

        {form.type === 'file' && (
          <div>
            <label className="text-sm text-secondary">
              Upload file
            </label>

            <input
              className="input-field mt-1"
              type="file"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
            />
          </div>
        )}

        {form.visibility === 'private' && (
          <div className="glass rounded-xl p-4">
            <p className="text-sm font-medium text-primary mb-3">
              Approved members with access
            </p>

            {members.length ? (
              <div className="grid sm:grid-cols-2 gap-2">
                {members.map((member) => (
                  <label
                    key={member.user_id}
                    className="flex items-center gap-2 text-sm text-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={allowed.includes(member.user_id)}
                      onChange={() =>
                        setAllowed((current) =>
                          current.includes(member.user_id)
                            ? current.filter(
                                (id) => id !== member.user_id
                              )
                            : [...current, member.user_id]
                        )
                      }
                    />

                    {member.display_name ||
                      member.user_id.slice(0, 8)}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">
                No approved members.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <GlassButton
            variant="ghost"
            type="button"
            onClick={onClose}
          >
            Cancel
          </GlassButton>

          <GlassButton type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save item'}
          </GlassButton>
        </div>
      </form>
    </Modal>
  );
}

export function AdminDashboard() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [{ data: itemData }, { data: logData }, { data: memberData }] =
        await Promise.all([
          supabase
            .from('vault_items')
            .select('*')
            .order('created_at', { ascending: false }),

          supabase
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(8),

          supabase
            .from('profiles')
            .select('*'),
        ]);

      setItems((itemData || []) as VaultItem[]);
      setLogs((logData || []) as ActivityLog[]);
      setMembers(memberData || []);
      setLoading(false);
    })();
  }, []);

  const stats = [
    ['Total', items.length, <FolderOpen />],
    [
      'Public',
      items.filter((x) => x.visibility === 'public').length,
      <Globe />,
    ],
    [
      'Unlisted',
      items.filter((x) => x.visibility === 'unlisted').length,
      <EyeOff />,
    ],
    [
      'Private',
      items.filter((x) => x.visibility === 'private').length,
      <Lock />,
    ],
    [
      'Approved',
      members.filter((x) => x.status === 'approved').length,
      <Users />,
    ],
    [
      'Pending',
      members.filter((x) => x.status === 'pending').length,
      <Clock />,
    ],
  ];

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-primary">
        Dashboard
      </h1>

      <p className="text-secondary mt-1 mb-7">
        Live overview from Supabase.
      </p>

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-7">
            {stats.map(([label, value, icon]) => (
              <GlassCard
                key={String(label)}
                className="p-5"
              >
                <div className="text-accent mb-3">
                  {icon}
                </div>

                <p className="text-2xl font-bold text-primary">
                  {value as any}
                </p>

                <p className="text-sm text-secondary">
                  {label as string}
                </p>
              </GlassCard>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <GlassCard className="p-5">
              <h2 className="font-semibold text-primary mb-4">
                Recent items
              </h2>

              {items.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-3 py-3 border-b border-subtle last:border-0"
                >
                  <span className="truncate text-primary">
                    {item.title}
                  </span>

                  <Badge variant={item.visibility}>
                    {item.visibility}
                  </Badge>
                </div>
              ))}
            </GlassCard>

            <GlassCard className="p-5">
              <h2 className="font-semibold text-primary mb-4">
                Recent activity
              </h2>

              {logs.map((item) => (
                <div
                  key={item.id}
                  className="py-3 border-b border-subtle last:border-0 text-sm"
                >
                  <p className="text-primary">
                    {item.action.replace(/_/g, ' ')}
                  </p>

                  <p className="text-xs text-muted">
                    {new Date(
                      item.created_at
                    ).toLocaleString()}
                  </p>
                </div>
              ))}
            </GlassCard>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

export function AdminItemsPage({
  typeFilter,
}: {
  typeFilter?: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<VaultItem[]>([]);
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<VaultItem | null>(null);
  const [del, setDel] = useState<VaultItem | null>(null);

  const load = async () => {
    let query = supabase
      .from('vault_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (typeFilter) {
      query = query.eq('type', typeFilter);
    }

    const { data } = await query;

    setItems((data || []) as VaultItem[]);
  };

  useEffect(() => {
    void load();
  }, [typeFilter]);

  const filtered = items.filter(
    (item) =>
      (visibility === 'all' ||
        item.visibility === visibility) &&
      (!search ||
        item.title
          .toLowerCase()
          .includes(search.toLowerCase()))
  );

  const remove = async () => {
    if (!del || !user) return;

    const { error } = await supabase
      .from('vault_items')
      .delete()
      .eq('id', del.id);

    if (error) {
      toast(error.message, 'error');
    } else {
      await log('item_deleted', user.id, {
        item_id: del.id,
        title: del.title,
      });

      toast('Item deleted', 'success');
      void load();
    }

    setDel(null);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {typeFilter
              ? `${
                  typeFilter[0].toUpperCase() +
                  typeFilter.slice(1)
                }s`
              : 'All Items'}
          </h1>

          <p className="text-secondary">
            Manage live vault content.
          </p>
        </div>

        <GlassButton
          onClick={() => {
            setEdit(null);
            setModal(true);
          }}
        >
          <Plus size={16} />
          Add item
        </GlassButton>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />

          <input
            className="input-field pl-10"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <GlassSelect
          value={visibility}
          onChange={(e) =>
            setVisibility(e.target.value)
          }
          options={[
            ['all', 'All'],
            ['public', 'Public'],
            ['unlisted', 'Unlisted'],
            ['private', 'Private'],
          ].map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </div>

      <div className="space-y-3">
        {filtered.length ? (
          filtered.map((item) => (
            <GlassCard
              key={item.id}
              className="p-4"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary truncate">
                      {item.title}
                    </span>

                    <Badge variant={item.visibility}>
                      {item.visibility}
                    </Badge>
                  </div>

                  <p className="text-sm text-secondary mt-1 truncate">
                    {item.description ||
                      item.url ||
                      item.file_name ||
                      'No description'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <GlassButton
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEdit(item);
                      setModal(true);
                    }}
                  >
                    <Edit3 size={15} />
                  </GlassButton>

                  <GlassButton
                    size="sm"
                    variant="danger"
                    onClick={() => setDel(item)}
                  >
                    <Trash2 size={15} />
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <EmptyState
            icon={<FolderOpen />}
            title="No items"
            description="Add your first vault item."
          />
        )}
      </div>

      <ItemModal
        open={modal}
        onClose={() => setModal(false)}
        item={edit}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={remove}
        title="Delete item?"
        message="This permanently removes the vault item."
        confirmText="Delete"
        danger
      />
    </AdminLayout>
  );
}

export function AdminMembersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [members, setMembers] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    setMembers(
      (data || []).map((item) => ({
        ...item,
        email: item.user_id,
      }))
    );
  };

  useEffect(() => {
    void load();
  }, []);

  const setStatus = async (
    id: string,
    status: MemberStatus
  ) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', id);

    if (error) {
      toast(error.message, 'error');
    } else {
      if (user) {
        await log(`member_${status}`, user.id, {
          target_user_id: id,
        });
      }

      toast(`Member ${status}`, 'success');
      void load();
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-primary">
        Members
      </h1>

      <p className="text-secondary mt-1 mb-6">
        Approve and suspend member accounts.
      </p>

      <div className="space-y-3">
        {members.map((member) => (
          <GlassCard
            key={member.user_id}
            className="p-4"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-primary">
                  {member.display_name ||
                    'Unnamed member'}
                </p>

                <p className="text-sm text-secondary">
                  {member.email}
                </p>

                <p className="text-xs text-muted mt-1">
                  {new Date(
                    member.created_at
                  ).toLocaleString()}
                </p>
              </div>

              <Badge variant={member.status}>
                {member.status}
              </Badge>

              <div className="flex gap-2">
                {member.status !== 'approved' && (
                  <GlassButton
                    size="sm"
                    onClick={() =>
                      setStatus(
                        member.user_id,
                        'approved'
                      )
                    }
                  >
                    <Check size={15} />
                    Approve
                  </GlassButton>
                )}

                {member.status === 'approved' && (
                  <GlassButton
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      setStatus(
                        member.user_id,
                        'suspended'
                      )
                    }
                  >
                    <X size={15} />
                    Suspend
                  </GlassButton>
                )}

                {member.status !== 'rejected' &&
                  member.status !== 'approved' && (
                    <GlassButton
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        setStatus(
                          member.user_id,
                          'rejected'
                        )
                      }
                    >
                      Reject
                    </GlassButton>
                  )}
              </div>
            </div>
          </GlassCard>
        ))}

        {!members.length && (
          <EmptyState
            icon={<Users />}
            title="No members"
            description="Member signups will appear here."
          />
        )}
      </div>
    </AdminLayout>
  );
}

export function AdminSharesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [shares, setShares] = useState<any[]>([]);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [itemId, setItemId] = useState('');
  const [expires, setExpires] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('share_links')
      .select('*, vault_items(title)')
      .order('created_at', { ascending: false });

    setShares(data || []);
  };

  useEffect(() => {
    void load();

    void supabase
      .from('vault_items')
      .select('*')
      .order('title')
      .then(({ data }) => {
        setItems((data || []) as VaultItem[]);
      });
  }, []);

  const create = async () => {
    if (!user || !itemId) return;

    const token = crypto
      .randomUUID()
      .replace(/-/g, '');

    const { error } = await supabase
      .from('share_links')
      .insert({
        item_id: itemId,
        token,
        expires_at: expires
          ? new Date(expires).toISOString()
          : null,
        created_by: user.id,
      });

    if (error) {
      toast(error.message, 'error');
    } else {
      await log('share_link_created', user.id, {
        item_id: itemId,
      });

      toast('Share link created', 'success');

      setItemId('');
      setExpires('');

      void load();
    }
  };

  const revoke = async (
    id: string,
    item_id: string
  ) => {
    const { error } = await supabase
      .from('share_links')
      .update({
        revoked_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast(error.message, 'error');
    } else {
      if (user) {
        await log('share_link_revoked', user.id, {
          item_id,
        });
      }

      toast('Share link revoked', 'success');
      void load();
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-primary">
        Share Links
      </h1>

      <p className="text-secondary mt-1 mb-6">
        Create secure unlisted share links and revoke
        them anytime.
      </p>

      <GlassCard className="p-5 mb-6">
        <div className="grid md:grid-cols-3 gap-3">
          <GlassSelect
            value={itemId}
            onChange={(e) =>
              setItemId(e.target.value)
            }
            options={[
              {
                value: '',
                label: 'Select item',
              },
              ...items.map((item) => ({
                value: item.id,
                label: item.title,
              })),
            ]}
          />

          <GlassInput
            type="datetime-local"
            value={expires}
            onChange={(e) =>
              setExpires(e.target.value)
            }
          />

          <GlassButton onClick={create}>
            <Plus size={15} />
            Create share
          </GlassButton>
        </div>
      </GlassCard>

      <div className="space-y-3">
        {shares.map((share) => (
          <GlassCard
            key={share.id}
            className="p-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1">
                <p className="font-semibold text-primary">
                  {share.vault_items?.title ||
                    share.item_id}
                </p>

                <p className="text-xs text-muted mt-1 break-all">
                  /share/{share.token}
                </p>

                <p className="text-xs text-muted mt-1">
                  {share.revoked_at
                    ? 'Revoked'
                    : share.expires_at
                    ? `Expires ${new Date(
                        share.expires_at
                      ).toLocaleString()}`
                    : 'No expiry'}
                </p>
              </div>

              <div className="flex gap-2">
                <GlassButton
                  size="sm"
                  variant="ghost"
                  disabled={!!share.revoked_at}
                  onClick={() =>
                    navigator.clipboard?.writeText(
                      `${location.origin}/share/${share.token}`
                    )
                  }
                >
                  <Copy size={15} />
                  Copy
                </GlassButton>

                <GlassButton
                  size="sm"
                  variant="danger"
                  disabled={!!share.revoked_at}
                  onClick={() =>
                    revoke(
                      share.id,
                      share.item_id
                    )
                  }
                >
                  Revoke
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </AdminLayout>
  );
}

export function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>(
    []
  );

  useEffect(() => {
    void supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs((data || []) as ActivityLog[]);
      });
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-primary">
        Activity
      </h1>

      <p className="text-secondary mt-1 mb-6">
        Audit trail of vault administration.
      </p>

      <GlassCard className="p-5">
        <div className="space-y-1">
          {logs.map((logItem) => (
            <div
              key={logItem.id}
              className="py-3 border-b border-subtle last:border-0 flex gap-3"
            >
              <Activity
                className="text-accent mt-0.5"
                size={16}
              />

              <div>
                <p className="text-sm text-primary">
                  {logItem.action.replace(/_/g, ' ')}
                </p>

                <p className="text-xs text-muted">
                  {new Date(
                    logItem.created_at
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {!logs.length && (
          <EmptyState
            icon={<Activity />}
            title="No activity yet"
          />
        )}
      </GlassCard>
    </AdminLayout>
  );
}

export function AdminSettingsPage() {
  const { user } = useAuth();

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-primary">
        Settings
      </h1>

      <p className="text-secondary mt-1 mb-6">
        Connection and administrator information.
      </p>

      <div className="grid md:grid-cols-2 gap-5">
        <GlassCard className="p-6">
          <h2 className="font-semibold text-primary mb-4">
            Supabase
          </h2>

          <p className="text-sm text-secondary">
            Frontend is connected through the
            publishable client key. RLS remains the
            source of truth for access.
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-semibold text-primary mb-4">
            Current admin
          </h2>

          <p className="text-sm text-secondary break-all">
            {user?.email}
          </p>

          <p className="text-xs text-muted mt-2">
            Admin membership is determined from
            admin_users.
          </p>
        </GlassCard>
      </div>
    </AdminLayout>
  );
}