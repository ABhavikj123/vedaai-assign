"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import { Icon } from "@/src/components/Icon";
import { useAssignmentStore } from "@/src/store/useAssignmentStore";

const navItems = [
  { href: "/home", label: "Home", icon: "four_box_symbol.svg", mobileIcon: "home_symbol_mobile.svg" },
  { href: "/my-groups", label: "My Groups", icon: "my_groups_symbol.svg", mobileIcon: "assignments_mobile.svg" },
  { href: "/assignments", label: "Assignments", icon: "assignments_logo.svg", mobileIcon: "assignments_mobile.svg" },
  { href: "/toolkit", label: "AI Teacher's Toolkit", icon: "AI_Teacher_toolkit_symbol.svg", mobileIcon: "magic_sparkles_symbol.svg" },
  { href: "/library", label: "My Library", icon: "my_library_symbol.svg", mobileIcon: "library_mobile.svg" },
  { href: "/settings", label: "Settings", icon: "Setting.svg", mobileIcon: "settings_mobile.svg" }
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children, title = "Assignment" }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAssignmentStore((state) => state.user);
  const isAuthenticated = useAssignmentStore((state) => state.isAuthenticated);
  const logout = useAssignmentStore((state) => state.logout);
  const assignmentCount = useAssignmentStore((state) => state.activeAssignments.length);
  const notifications = useAssignmentStore((state) => state.notifications);
  const markNotificationRead = useAssignmentStore((state) => state.markNotificationRead);
  const fetchAssignments = useAssignmentStore((state) => state.fetchAssignments);

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  useEffect(() => {
    let cancelled = false;

    const prepareShell = async () => {
      try {
        if (!useAssignmentStore.persist.hasHydrated()) {
          await useAssignmentStore.persist.rehydrate();
        }
      } catch (error) {
        console.error("Could not restore saved session", error);
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    void prepareShell();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated && pathname !== "/login" && pathname !== "/signup") {
      router.replace("/login");
      return;
    }

    if (isAuthenticated) {
      void fetchAssignments();
    }
  }, [pathname, isReady, isAuthenticated, router, fetchAssignments]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    logout();
    router.replace("/login");
  };

  if (!isReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-b from-[#EEEEEE] to-[#DADADA] font-display font-bold text-[#303030]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#303030] border-t-transparent mx-auto" />
          <p className="text-sm font-medium text-[#5e5e5e]">Syncing user interface workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-app-gradient text-[#303030]">
      <div className="pointer-events-none fixed left-1/4 top-1/3 h-80 w-80 rounded-full bg-black/20 blur-[160px]" />

      <div className="mx-auto grid h-screen w-full max-w-[1680px] grid-cols-1 gap-4 p-3 pb-24 md:p-4 md:pb-4 lg:grid-cols-[304px_minmax(0,1fr)]">

        <aside className="hidden h-[calc(100vh-32px)] shrink-0 rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.16)] lg:flex lg:flex-col">
          <div className="flex h-full min-h-0 flex-col">

            <Link
              href="/assignments"
              className="flex items-center"
            >
              <div className="relative flex h-[56px] w-[56px] shrink-0 items-center justify-center overflow-visible">
                <img
                  src="/symbols/logo_web.svg"
                  alt="VedaAI"
                  className="h-[72px] w-[72px] max-w-none object-contain translate-y-[2px]"
                />
              </div>

              <span
                className="ml-2 font-display text-[27px] font-black leading-none text-[#1f1f1f] pb-5"
              >
                VedaAI
              </span>
            </Link>

            <Link
              href="/assignments/create"
              className="mt-10 flex h-[52px] min-h-[52px] items-center justify-center gap-3 rounded-full border-[3px] border-[#ff7a59] bg-[#272727] px-5 font-action text-[17px] font-semibold text-white shadow-[inset_0_8px_20px_rgba(255,255,255,0.12),0_16px_28px_rgba(0,0,0,0.18)]"
            >
              <Icon
                name="magic_sparkles_symbol.svg"
                alt=""
                size={22}
                className="brightness-0 invert"
              />

              Create Assignment
            </Link>

            <nav className="mt-10 flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-1 max-h-[320px] xl:max-h-none">
              {navItems
                .filter((item) => item.href !== "/settings")
                .map((item) => {
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex h-12 min-h-12 items-center gap-4 rounded-xl px-4 font-action text-[16px] transition-colors ${active
                        ? "bg-[#f1f1f1] font-bold text-[#181818]"
                        : "text-[#7b7b7b] hover:bg-neutral-50"
                        }`}
                    >
                      <Icon
                        name={item.icon}
                        alt=""
                        size={22}
                        className={active ? "opacity-100" : "opacity-80"}
                      />

                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>

                      {item.href === "/assignments" && assignmentCount > 0 ? (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff6b4a] px-2.5 py-0.5 text-xs font-bold text-white">
                          {assignmentCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
            </nav>

            <div className="mt-auto pt-5">
              <Link
                href="/settings"
                className={`flex h-12 items-center gap-4 rounded-xl px-4 font-action text-[16px] transition-colors ${isActive(pathname, "/settings")
                  ? "bg-[#f1f1f1] font-bold text-[#181818]"
                  : "text-[#7b7b7b] hover:bg-neutral-50"
                  }`}
              >
                <Icon
                  name="Setting.svg"
                  alt=""
                  size={22}
                  className={isActive(pathname, "/settings") ? "opacity-100" : "opacity-80"}
                />

                <span>Settings</span>
              </Link>

              <div className="mt-5 rounded-[24px] bg-[#f1f1f1] p-4 border border-black/5">
                <div className="flex items-center gap-4">
                  <img
                    src="/symbols/default_profile_logo.jpg"
                    alt="Profile"
                    width={52}
                    height={52}
                    className="h-[52px] w-[52px] rounded-full object-cover shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[16px] font-bold text-[#222]">
                      {user?.schoolName || "Delhi Public School"}
                    </p>

                    <p className="mt-0.5 truncate font-action text-xs font-medium text-[#a3a3a3]">
                      {user?.schoolAddress || "Bokaro Steel City"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden">
            <aside ref={mobileMenuRef} className="h-full w-72 bg-white p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200">
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between px-2">
                  <img src="/symbols/logo_web.svg" alt="VedaAI" width={140} height={44} className="h-11 w-auto" />
                  <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-1">
                    <Icon name="Arrow_Left.svg" alt="Close" size={20} />
                  </button>
                </div>

                <Link
                  href="/assignments/create"
                  className="mt-8 flex h-11 items-center justify-center gap-2 rounded-full border-2 border-[#ff7a59] bg-[#272727] px-4 font-action text-sm font-semibold text-white shadow-md"
                >
                  <Icon name="magic_sparkles_symbol.svg" alt="" size={18} className="brightness-0 invert" />
                  Create Assignment
                </Link>

                <nav className="mt-8 flex flex-col gap-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex h-11 items-center gap-3 rounded-lg px-3 font-action text-sm transition-colors ${active ? "bg-[#f1f1f1] font-bold text-[#181818]" : "text-[#7b7b7b]"
                          }`}
                      >
                        <Icon name={item.icon} alt="" size={18} />
                        <span className="truncate flex-1">{item.label}</span>
                        {item.href === "/assignments" && assignmentCount > 0 ? (
                          <span className="rounded-full bg-[#ff6b4a] px-2 py-0.5 text-xs font-bold text-white">
                            {assignmentCount}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4">
                <div className="flex items-center gap-3 rounded-xl bg-[#f1f1f1] p-3 border border-black/5">
                  <img src="/symbols/default_profile_logo.jpg" alt="Profile" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold text-[#222]">{user?.schoolName || "Delhi Public School"}</p>
                    <p className="truncate font-action text-[11px] text-[#a3a3a3] mt-0.5">{user?.schoolAddress || "Bokaro Steel City"}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        <div className="flex min-h-0 min-w-0 flex-col gap-3 md:gap-4">

          <header className="z-20 flex h-[58px] shrink-0 items-center justify-between rounded-2xl bg-white/80 px-4 shadow-sm backdrop-blur-[20px] md:h-[64px] md:px-5">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back"
                className="hidden md:grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm"
              >
                <Icon name="Arrow_Left.svg" alt="" size={22} />
              </button>

              <div className="flex items-center gap-2 lg:hidden">
                <img src="/symbols/logo_mobile.svg" alt="Logo" className="h-8 w-8 object-contain" />
                <span className="font-display font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#181818] to-[#404040]">VedaAI</span>
              </div>

              <span className="hidden lg:inline text-[#a9a9a9]">
                <Icon name="four_box_symbol.svg" alt="" size={24} />
              </span>
              <p className="hidden lg:inline font-display text-[22px] font-semibold text-[#a9a9a9]">
                {title}
              </p>
            </div>

            <div className="flex items-center gap-2.5 md:gap-3">
              <div className="relative">
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={() => setNotificationOpen((open) => !open)}
                  className="relative grid h-10 w-10 md:h-11 md:w-11 place-items-center rounded-full bg-white border border-black/5 shadow-sm md:border-none md:shadow-none"
                >
                  <Icon name="bell_symbol.svg" alt="" size={20} />
                  {unreadCount > 0 ? <span className="absolute right-2 top-1 h-2.5 w-2.5 rounded-full bg-[#ff5623]" /> : null}
                </button>

                {notificationOpen ? (
                  <div className="absolute right-0 top-14 z-40 w-[320px] rounded-2xl bg-white p-3 shadow-[0_18px_45px_rgba(0,0,0,0.20)]">
                    <div className="mb-2 flex items-center justify-between px-2">
                      <p className="font-display font-bold">Notifications</p>
                      <span className="font-action text-xs text-[#777]">{unreadCount} unread</span>
                    </div>
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-2 py-4 font-action text-sm text-[#777]">Queue updates will appear here.</p>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => {
                              markNotificationRead(notification.id);
                              setNotificationOpen(false);
                              router.push(notification.link);
                            }}
                            className={`w-full rounded-xl p-3 text-left font-action text-sm ${notification.read ? "bg-[#f5f5f5] text-[#777]" : "bg-[#fff3ee] text-[#303030]"
                              }`}
                          >
                            <span className="font-semibold">{notification.message}</span>
                            <span className="mt-1 block text-xs text-[#888]">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <img src="/symbols/default_profile_logo.jpg" alt="Profile" width={38} height={38} className="h-[38px] w-[38px] md:h-[42px] md:w-[42px] rounded-full" />

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 outline-none transition-all md:flex border border-black/5 hover:bg-neutral-50"
                >
                  <span className="font-action font-bold text-sm text-[#303030]">{user?.fullName || "John Doe"}</span>
                  <div className={`transform transition-transform duration-200 flex items-center justify-center ${profileOpen ? "rotate-180" : "rotate-0"}`}>
                    <Icon name="chevron_down_symbol.svg" alt="" size={14} />
                  </div>
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 top-12 z-50 w-44 rounded-xl bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.15)] border border-neutral-100">
                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-action text-sm font-semibold text-[#c53535] hover:bg-red-50/60 transition-colors"
                    >
                      <Icon name="logout_symbol.svg" alt="" size={18} className="opacity-80" />
                      Sign Out
                    </button>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Menu"
                className="grid h-10 w-10 place-items-center rounded-full bg-white border border-black/5 shadow-sm lg:hidden"
              >
                <Icon name="menu_three_lines.svg" alt="" size={20} />
              </button>
            </div>
          </header>

          <div className="lg:hidden px-2 pt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="grid h-10 w-10 place-items-center rounded-full bg-white border border-black/5 shadow-sm"
            >
              <Icon name="Arrow_Left.svg" alt="" size={18} />
            </button>
            <h1 className="font-display font-black text-xl text-[#303030]">{title}</h1>
          </div>

          <div className="min-h-0 overflow-y-auto pr-0 lg:pr-1 flex-1 flex flex-col px-1 md:px-0">
            {children}
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-4 z-30 grid h-[68px] grid-cols-4 rounded-[22px] bg-[#141414] px-2 shadow-[0_12px_32px_rgba(0,0,0,0.35)] lg:hidden">
        {navItems
          .filter((item) => item.href !== "/my-groups" && item.href !== "/settings")
          .map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-0.5">
                <Icon name={item.mobileIcon} alt="" size={20} className={active ? "brightness-0 invert" : "opacity-40"} />
                <span className={`font-action text-[10px] scale-95 font-medium transition-colors ${active ? "text-white" : "text-white/40"}`}>
                  {item.href === "/toolkit" ? "AI Toolkit" : item.label.replace("My ", "")}
                </span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
