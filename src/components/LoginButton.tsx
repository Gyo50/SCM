// src/components/LoginButton.tsx
"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function LoginButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 로그인 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: window.location.origin },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{user.user_metadata.full_name}님</span>
        <button onClick={handleLogout} className="text-xs text-gray-500 underline">로그아웃</button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="bg-[#FEE500] text-[#191919] px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
    >
      카카오로 로그인
    </button>
  );
}