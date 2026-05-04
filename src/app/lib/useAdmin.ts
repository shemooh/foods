"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData.user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", userData.user.id)
        .maybeSingle();

      setIsAdmin(!!data);
      setLoading(false);
    };

    check();
  }, []);

  return { isAdmin, loading };
}