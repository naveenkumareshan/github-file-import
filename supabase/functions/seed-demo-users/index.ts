import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const demoUsers = [
      { email: 'admin@inhalestays.com', password: 'Admin@123', role: 'admin', name: 'Admin User' },
      { email: 'superadmin@inhalestays.com', password: 'Super@123', role: 'super_admin', name: 'Super Admin' },
      { email: 'student@inhalestays.com', password: 'Student@123', role: 'student', name: 'Demo Student' },
      { email: 'host@inhalestays.com', password: 'Host@123', role: 'vendor', name: 'Demo Host' },
      { email: 'employee@inhalestays.com', password: 'Employee@123', role: 'vendor_employee', name: 'Demo Employee' },
    ]

    const results = []

    for (const u of demoUsers) {
      // Check if user already exists
      const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existing?.users?.find(eu => eu.email === u.email)
      
      let userId: string

      if (existingUser) {
        userId = existingUser.id
        results.push({ email: u.email, status: 'already_exists', userId })
      } else {
        // Create user
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { name: u.name }
        })

        if (error) {
          results.push({ email: u.email, status: 'error', error: error.message })
          continue
        }

        userId = data.user.id
        results.push({ email: u.email, status: 'created', userId })
      }

      // Upsert role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: userId, role: u.role }, { onConflict: 'user_id,role' })

      if (roleError) {
        results.push({ email: u.email, status: 'role_error', error: roleError.message })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
