import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { name, email, phone, password, propertyTypes } = await req.json();

    if (!name || !email || !phone || !password) {
      return new Response(
        JSON.stringify({ error: "Name, email, phone and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email
    if (!/\S+@\S+\.\S+/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone
    if (!/^\d{10}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number. Must be 10 digits." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userId: string;
    let isExistingUser = false;

    // Try to create user
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

    if (createError) {
      if (createError.message?.includes("already been registered")) {
        // User already exists — look them up and add vendor role
        const { data: listData, error: listError } =
          await supabaseAdmin.auth.admin.listUsers();

        if (listError) throw listError;

        const existingUser = listData.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );

        if (!existingUser) {
          return new Response(
            JSON.stringify({ error: "Could not find existing account. Please contact support." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if already a vendor
        const { data: existingRole } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", existingUser.id)
          .eq("role", "vendor")
          .maybeSingle();

        if (existingRole) {
          return new Response(
            JSON.stringify({ error: "You are already registered as a partner. Please login instead." }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        userId = existingUser.id;
        isExistingUser = true;
      } else {
        throw createError;
      }
    } else {
      userId = newUser.user.id;

      // For new users: remove default student role (added by trigger)
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "student");
    }

    // Add vendor role
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "vendor" });

    // Update profile with phone
    await supabaseAdmin
      .from("profiles")
      .update({ name, phone })
      .eq("id", userId);

    // Check if partner record already exists
    const { data: existingPartner } = await supabaseAdmin
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingPartner) {
      // Create minimal partner record for admin follow-up
      const partnerData: any = {
        user_id: userId,
        business_name: name,
        business_type: "individual",
        contact_person: name,
        email,
        phone,
        status: "pending",
        address: {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        },
      };

      // Store interested property types in business_details
      if (propertyTypes && Array.isArray(propertyTypes) && propertyTypes.length > 0) {
        partnerData.business_details = { interested_property_types: propertyTypes };
      }

      const { error: partnerError } = await supabaseAdmin
        .from("partners")
        .insert(partnerData);

      if (partnerError) {
        console.error("Failed to create partner record:", partnerError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, userId, email, isExistingUser }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("partner-register error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Registration failed. Please try again.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
