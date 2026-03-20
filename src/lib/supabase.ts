import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://syhazrjgeegsjzegxxwp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Bz3X_jNVtA162kY_oQX-Qw_J8zXFfSn";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
