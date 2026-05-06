import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 在运行时检查环境变量，避免构建时崩溃
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE");
  }
  return createClient(url, key);
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE");
  }
  return new Resend(apiKey);
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient();
    const resend = getResendClient();

    const { email } = await req.json(); 
    
    // 1. 生成 6 位随机验证码
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. 将邮箱和验证码存入 Supabase
    const { error: dbError } = await supabase
      .from('protocol_nodes')
      .upsert({ 
        email, 
        otp_code: otp, 
        status: 'PENDING_VERIFICATION' 
      }, { onConflict: 'email' });

    if (dbError) throw dbError;

    // 3. 发送验证邮件
    const { error: emailError } = await resend.emails.send({
      from: 'MyShape Protocol <onboarding@resend.dev>',
      to: email,
      subject: 'ACTION_REQUIRED: IDENTITY_CHALLENGE',
      html: `
        <div style="background:#000; color:#90c8ff; padding:40px; font-family:monospace; border:1px solid #333;">
          <h2 style="border-bottom:1px solid #333; padding-bottom:10px">GENESIS_UPLINK_CHALLENGE</h2>
          <p>Detecting new node connection attempt...</p>
          <p>Your unique verification signature is:</p>
          <div style="font-size:32px; font-weight:bold; letter-spacing:8px; margin:20px 0; padding:15px; border:1px dashed #90c8ff; text-align:center;">
            ${otp}
          </div>
          <p style="font-size:10px; color:#555;">TIMESTAMP: ${new Date().toISOString()}</p>
          <p style="font-size:10px; color:#555;">DO_NOT_SHARE_THIS_HASH</p>
        </div>
      `,
    });

    if (emailError) throw emailError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API_ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'INTERNAL_SERVER_ERROR' }, 
      { status: 500 }
    );
  }
}
