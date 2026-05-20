import supabase from '../../config/supabase.js';

export const createUser = async (userData) => {
    const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

    if (error) throw error;

    return data;
};

export const getUserByEmail = async (email) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

    if (error) throw error;

    return data;
};

export const getUserById = async (id) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error;

    return data;
};

export const updateRefreshToken = async (
    id,
    refreshToken
) => {
    const { data, error } = await supabase
        .from('users')
        .update({
            refresh_token: refreshToken
        })
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error;

    return data;
}

export const getUserByUsernameOrEmail = async (username, email) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${username},email.eq.${email}`)
        .maybeSingle();


    if (error) throw error;

    return data;
};

export const getSafeUserById = async (id) => {

    const { data, error } = await supabase
        .from("users")
        .select(`
            id,
            username,
            email,
            fullname,
            avatar,
            cover_image,
            created_at,
            updated_at
            `)
        .eq("id", id)
        .single();

    if (error) throw error;

    return data;
}