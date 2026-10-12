"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminRole,
  createAdminUser,
  deleteAdminRole,
  deleteAdminUser,
  listAdminPermissions,
  listAdminRoles,
  listAdminUsers,
  updateAdminRole,
  updateAdminUser,
} from "@/lib/api/admin-users";
import { slugify } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const USER_EMPTY = {
  name: "",
  email: "",
  username: "",
  password: "",
  status: "ACTIVE",
  roleIds: [],
};

const ROLE_EMPTY = {
  name: "",
  slug: "",
  description: "",
  permissionIds: [],
  slugTouched: false,
};

const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

function groupPermissions(permissions) {
  return permissions.reduce((groups, permission) => {
    if (!groups[permission.module]) groups[permission.module] = [];
    groups[permission.module].push(permission);
    return groups;
  }, {});
}

export default function AdminUsersRolesManager() {
  const { admin } = useAdminAuth();
  const canCreateUser = hasPermission(admin, "users.create");
  const canUpdateUser = hasPermission(admin, "users.update");
  const canDeleteUser = hasPermission(admin, "users.delete");
  const canReadRoles = hasPermission(admin, "roles.read");
  const canCreateRole = hasPermission(admin, "roles.create");
  const canUpdateRole = hasPermission(admin, "roles.update");
  const canDeleteRole = hasPermission(admin, "roles.delete");

  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [userForm, setUserForm] = useState(USER_EMPTY);
  const [editUserId, setEditUserId] = useState("");
  const [roleForm, setRoleForm] = useState(ROLE_EMPTY);
  const [editRoleId, setEditRoleId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, rolesRes, permissionsRes] = await Promise.all([
        listAdminUsers({ limit: 100 }),
        listAdminRoles({ limit: 100 }),
        listAdminPermissions(),
      ]);
      setUsers(usersRes.items);
      setRoles(rolesRes.items);
      setPermissions(Array.isArray(permissionsRes) ? permissionsRes : []);
    } catch {
      setError("Unable to load users and roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const permissionGroups = useMemo(() => groupPermissions(permissions), [permissions]);

  function resetUserForm() {
    setEditUserId("");
    setUserForm(USER_EMPTY);
  }

  function resetRoleForm() {
    setEditRoleId("");
    setRoleForm(ROLE_EMPTY);
  }

  function toggleUserRole(roleId) {
    setUserForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  }

  function toggleRolePermission(permissionId) {
    setRoleForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  }

  function toggleModule(moduleName, checked) {
    const ids = permissionGroups[moduleName].map((permission) => permission.id);
    setRoleForm((prev) => ({
      ...prev,
      permissionIds: checked
        ? [...new Set([...prev.permissionIds, ...ids])]
        : prev.permissionIds.filter((id) => !ids.includes(id)),
    }));
  }

  async function saveUser(event) {
    event.preventDefault();
    if (editUserId ? !canUpdateUser : !canCreateUser) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        username: userForm.username.trim(),
        status: userForm.status,
        roleIds: userForm.roleIds,
      };
      if (userForm.password) payload.password = userForm.password;
      if (editUserId) await updateAdminUser(editUserId, payload);
      else await createAdminUser({ ...payload, password: userForm.password });
      resetUserForm();
      setMessage("User saved.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save user.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRole(event) {
    event.preventDefault();
    if (editRoleId ? !canUpdateRole : !canCreateRole) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        name: roleForm.name.trim(),
        slug: slugify(roleForm.slug || roleForm.name),
        description: roleForm.description.trim() || null,
        permissionIds: roleForm.permissionIds,
      };
      if (editRoleId) await updateAdminRole(editRoleId, payload);
      else await createAdminRole(payload);
      resetRoleForm();
      setMessage("Role saved.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save role.");
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(id) {
    if (!canDeleteUser) return;
    if (!window.confirm("Delete this admin user?")) return;
    setError("");
    setMessage("");
    try {
      await deleteAdminUser(id);
      setMessage("User deleted.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete user.");
    }
  }

  async function removeRole(role) {
    if (!canDeleteRole) return;
    if (!window.confirm(`Delete role “${role.name}”?`)) return;
    setError("");
    setMessage("");
    try {
      await deleteAdminRole(role.id);
      setMessage("Role deleted.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete role.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Users & roles</h1>
        <p className="mt-2 text-sm text-muted">Manage admin staff accounts, roles, and permission access.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "users", label: "Users", show: true },
          { id: "roles", label: "Roles", show: canReadRoles },
        ].filter((item) => item.show).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === item.id ? "bg-accent text-white" : "border border-line bg-elevated text-ink hover:bg-accent-soft"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingState label="Loading users and roles" /> : null}
      {error ? <ErrorState title="Users & roles unavailable" description={error} /> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      {!loading && !error && tab === "users" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {(canCreateUser || canUpdateUser) ? (
          <form onSubmit={saveUser} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl">{editUserId ? "Edit user" : "New user"}</h2>
              {editUserId ? <Button type="button" variant="secondary" size="sm" onClick={resetUserForm}>Cancel</Button> : null}
            </div>
            <Input label="Name" value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} required />
            <Input label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} required />
            <Input label="Username" value={userForm.username} onChange={(e) => setUserForm((p) => ({ ...p, username: e.target.value }))} required />
            <Input
              label={editUserId ? "New password (optional)" : "Password"}
              type="password"
              minLength={8}
              value={userForm.password}
              onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
              required={!editUserId}
            />
            <label className="flex flex-col gap-1.5 text-xs font-medium tracking-[0.08em] text-muted uppercase">
              Status
              <select
                value={userForm.status}
                onChange={(e) => setUserForm((p) => ({ ...p, status: e.target.value }))}
                className="h-12 rounded-xl border border-line bg-elevated px-3 text-sm font-normal normal-case tracking-normal text-ink"
              >
                {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <div>
              <p className="mb-2 text-xs font-medium tracking-[0.08em] text-muted uppercase">Roles</p>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-line p-3">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={userForm.roleIds.includes(role.id)}
                      onChange={() => toggleUserRole(role.id)}
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={busy || !userForm.roleIds.length || (editUserId ? !canUpdateUser : !canCreateUser)}>
              {busy ? "Saving..." : "Save user"}
            </Button>
          </form>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-line/80">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-left font-medium text-ink hover:text-accent"
                        onClick={() => {
                          if (!canUpdateUser) return;
                          setEditUserId(user.id);
                          setUserForm({
                            name: user.name || "",
                            email: user.email || "",
                            username: user.username || "",
                            password: "",
                            status: user.status || "ACTIVE",
                            roleIds: (user.roles || []).map((role) => role.id),
                          });
                        }}
                      >
                        {user.name}
                      </button>
                      <p className="text-xs text-muted">{user.email} · @{user.username}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{(user.roles || []).map((role) => role.name).join(", ") || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {canDeleteUser ? (
                        <button type="button" className="text-sm text-red-700 hover:underline" onClick={() => removeUser(user.id)}>
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && !error && tab === "roles" && canReadRoles ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {(canCreateRole || canUpdateRole) ? (
          <form onSubmit={saveRole} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl">{editRoleId ? "Edit role" : "New role"}</h2>
              {editRoleId ? <Button type="button" variant="secondary" size="sm" onClick={resetRoleForm}>Cancel</Button> : null}
            </div>
            <Input
              label="Name"
              value={roleForm.name}
              onChange={(e) => {
                const name = e.target.value;
                setRoleForm((p) => ({ ...p, name, slug: p.slugTouched ? p.slug : slugify(name) }));
              }}
              required
            />
            <Input
              label="Slug"
              value={roleForm.slug}
              onChange={(e) => setRoleForm((p) => ({ ...p, slug: e.target.value, slugTouched: true }))}
              required
            />
            <label className="block text-sm text-ink">
              Description
              <textarea
                value={roleForm.description}
                onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm"
              />
            </label>
            <div className="max-h-[26rem] space-y-3 overflow-y-auto rounded-xl border border-line p-3">
              {Object.entries(permissionGroups).map(([moduleName, modulePermissions]) => {
                const checkedCount = modulePermissions.filter((permission) => roleForm.permissionIds.includes(permission.id)).length;
                return (
                  <div key={moduleName} className="rounded-lg border border-line/70 p-3">
                    <label className="mb-2 flex items-center justify-between gap-2 text-sm font-medium text-ink">
                      <span>{moduleName}</span>
                      <input
                        type="checkbox"
                        checked={checkedCount === modulePermissions.length}
                        ref={(input) => {
                          if (input) input.indeterminate = checkedCount > 0 && checkedCount < modulePermissions.length;
                        }}
                        onChange={(e) => toggleModule(moduleName, e.target.checked)}
                      />
                    </label>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {modulePermissions.map((permission) => (
                        <label key={permission.id} className="flex items-center gap-2 text-xs text-muted">
                          <input
                            type="checkbox"
                            checked={roleForm.permissionIds.includes(permission.id)}
                            onChange={() => toggleRolePermission(permission.id)}
                          />
                          {permission.action}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button type="submit" disabled={busy || (editRoleId ? !canUpdateRole : !canCreateRole)}>
              {busy ? "Saving..." : "Save role"}
            </Button>
          </form>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-t border-line/80">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-left font-medium text-ink hover:text-accent"
                        onClick={() => {
                          if (!canUpdateRole) return;
                          setEditRoleId(role.id);
                          setRoleForm({
                            name: role.name || "",
                            slug: role.slug || "",
                            description: role.description || "",
                            permissionIds: (role.permissions || []).map((permission) => permission.id),
                            slugTouched: true,
                          });
                        }}
                      >
                        {role.name}
                      </button>
                      <p className="text-xs text-muted">{role.slug}{role.isSystem ? " · system" : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{(role.permissions || []).length}</td>
                    <td className="px-4 py-3 text-right">
                      {!role.isSystem && canDeleteRole ? (
                        <button type="button" className="text-sm text-red-700 hover:underline" onClick={() => removeRole(role)}>
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
