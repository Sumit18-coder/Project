import supabase from "../config/supabse.js";

export const createVideo = async (videoData) => {
    const {data, error} = await supabase
        .from('videos')
        .insert([videoData])
        .select()
        .single()

        if(error) throw error;

        return data;
};

export const getAllVideos = async () => {
    const {data, error} = await supabase
        .from('videos')
        .select(`
            *,
            users(*)
            `);

        if(error) throw error;

        return data;
}

export const getVideoById = async (id) => {
    const {data, error} = await supabase
        .from('videos')
        .select(`
            *,
            users(*)
            `)
        .eq('id',id)
        .single()

        if(error) throw error;

        return data;
}

export const incrementViews = async(
    id, 
    currentViews
) => {
   
    const {data, error} = await supabase
        .from('videos')
        .update({
            views: currentViews + 1
        })
        .eq('id',id)
        .select()
        .single()

        if(error) throw error;

        return data;
}