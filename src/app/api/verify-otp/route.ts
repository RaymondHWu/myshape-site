import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 关键修正：防止 Build 阶段因为环境变量缺失而中断
// 使用 fallback 字符串确保构造函数能运行，实际运行时会检查真实变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    // 运行时严格检查
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("SERVER_CONFIGURATION_INCOMPLETE");
    }

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