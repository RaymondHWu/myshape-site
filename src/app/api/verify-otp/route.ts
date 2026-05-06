import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE");
  }
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();

    const { email, otp } = await req.json();

    // 1. 从数据库校验 OTP
    const { data, error: dbError } = await supabase
      .from('protocol_nodes')
      .select('otp_code, status')
      .eq('email', email)
      .single();

    if (dbError || !data) {
      return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    // 2. 匹配验证码
    if (data.otp_code !== otp) {
      return NextResponse.json({ error: "SIGNATURE_INVALID" }, { status: 401 });
    }

    // 3. 验证成功，更新状态
    const { error: updateError } = await supabase
      .from('protocol_nodes')
      .update({ status: 'ACTIVE' })
      .eq('email', email);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('VERIFY_ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}
