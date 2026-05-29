import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import supabase from "../../config/supabase.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    //validate fields
    if (!name?.trim()) {
        throw new ApiError(
            400,
            "Playlist name is required"
        )
    }

    if (!description?.trim()) {
        throw new ApiError(
            400,
            "Playlist description is required"
        )
    }

    //create playlist
    const { data: playlist, error } = await supabase
        .from("playlists")
        .insert([
            {
                name,
                description,
                owner: req.user.id
            }
        ])
        .select(`
        *,
        users:owner (
               id,
               username,
               fullname,
               avatar
            )
        `)
        .single();

    if (error) {
        throw new ApiError(
            500,
            error.message
        )
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                playlist,
                "Playlist created successfully"
            )
        )

})

const getUserPlaylist = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // validate user id
    if (!userId) {
        throw new ApiError(
            400,
            "User id is required"
        );
    }

    //fetch playlists
    const { data: playlists, error } = await supabase
        .from("playlists")
        .select(`
            *,
            users:owner (
            id,
            username,
            fullname,
            avatar
        )
    `)
        .eq("owner", userId)
        .order("created_by", {
            ascending: false
        })

    if (error) {
        throw new ApiError(
            500,
            error.message
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlists,
                "User playlists fetched successfully"
            )
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    //validate playlistId
    if (!playlistId) {
        throw new ApiError(
            400,
            "Playlist id is required"
        )
    }

    //fetch playlist
    const { data: playlist, error } = await supabase
        .from("playlists")
        .select(`
            *,
            users:owner (
            id,
            username,
            fullname,
            avatar
        )
      `)
        .eq("id", playlistId)
        .single()


    if (error || !playlistId) {
        throw new ApiError(
            404,
            "Playlist not found"
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist fetched successfully"
            )
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // validate ids
    if (!playlistId || !videoId) {
        throw new ApiError(
            400,
            "Playlist id and video id are required"
        );
    }

    //check playlist exists
    const {
        data: playlist,
        error: playlistError
    } = await supabase
        .from("playlist")
        .select("*")
        .eq("id", playlistId)
        .single()

    if (playlistError || !playlist) {
        throw new ApiError(
            404,
            "Playlist not found"
        )
    }

    //ownership check
    if (playlist.owner !== req.user.id) {
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }

    //check video exists
    const { data: video, error: videoError } = await supabase
        .from("videos")
        .select("*")
        .eq("id", videoId)
        .single()

    if (videoError) {
        throw new ApiError(
            404,
            "Video not found"
        )
    }

    //check if already added
    const { data: existingVideo } = await supabase
        .from("playlist_videos")
        .select("*")
        .eq("playlist_id", playlistId)
        .eq("video_id", videoId)
        .maybeSingle()

    if (existingVideo) {
        throw new ApiError(
            400,
            "Video already exists in playlist"
        )
    }

    //add video to playlist
    const { data, error } = await supabase
        .from("playlist_videos")
        .insert([
            {
                playlist_id: playlistId,
                video_id: videoId
            }
        ])
        .select()
        .single()

    if (error) {
        throw new ApiError(
            500,
            error.message
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                data,
                "Video added to playlist sucessfully"
            )
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // validate ids
    if (!playlistId || !videoId) {
        throw new ApiError(
            400,
            "Playlist id and video id are required"
        );
    }

    // check playlist exists
    const {
        data: playlist,
        error: playlistError
    } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .single();

    if (playlistError || !playlist) {
        throw new ApiError(
            404,
            "Playlist not found"
        );
    }

    // ownership check
    if (
        playlist.owner !== req.user.id
    ) {
        throw new ApiError(
            403,
            "Unauthorized request"
        );
    }

    //check if video exists in playlist
    const { data: existingVideo, error: existingError } = await supabase
        .from("playlist_videos")
        .select("*")
        .eq("playlist_id", playlistId)
        .eq("video_id", videoId)
        .maybeSingle()

    if (existingError) {
        throw new ApiError(
            500,
            existingError.message
        )
    }

    if (!existingVideo) {
        throw new ApiError(
            404,
            "Video not found in playlist"
        )
    }

    //remove video from playlist
    const { error: deleteError } = await supabase
        .from("playlist_videos")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("video_id", videoId)

    if (deleteError) {
        throw new ApiError(
            500,
            deleteError.message
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Video removed from playlist successfully"
            )
        )
})

const deletePlaylist = asyncHandler(async(req, res) => {
    const {playlistId} = req.params

    //validate playlist
    if(!playlistId){
        throw new ApiError(
            400,
            "Playlist id is required"
        )
    }

    //check playlist exists
    const {data: playlist, error: fetchError} = await supabase
      .from("playlists")
      .select("*")
      .eq("id",playlistId)
      .single()

    if(fetchError || !playlist){
        throw new ApiError(
            404,
            "Playlist not found"
        )
    }

    //ownership check
    if(playlist.owner !== req.user.id){
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }

    //delete playlist
    const {error: deleteError} = await supabase
       .from("playlists")
       .delete()
       .eq("id", playlistId)

    if(deleteError){
        throw new ApiError(
            500,
            deleteError.message
        )
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
            200,
            {},
            "Playlist deleted successfully"
        )
      )
})

const updatePlaylist = asyncHandler(async(req, res) => {
    const {playlistId}  = req.params
    const {name, description} = req.body

    //validate playlist id 
    if(!playlistId){
        throw new ApiError(
            400,
            "Playlist id is required"
        )
    }

    //validate fields
    if(!name?.trim() && !description?.trim()){
        throw new ApiError(
            400,
            "At least one field is required"
        )
    }

    //check playlist exists
    //check playlist exists
    const {data: playlist, error: fetchError} = await supabase
      .from("playlists")
      .select("*")
      .eq("id",playlistId)
      .single()

    if(fetchError || !playlist){
        throw new ApiError(
            404,
            "Playlist not found"
        )
    }

    //ownership check
    if(playlist.owner !== req.user.id){
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }

    //prepare update object
    const updateData = {};

    if(name?.trim()){
        updateData.name = name;
    }
    if(description?.trim()){
        updateData.description = description;
    }

    //update playlist
    const {data: updatedPlaylist, error: updateError} = await supabase
      .from("playlists")
      .update(updateData)
      .eq("id",playlistId)
      .select(`
        *,
        users: owner (
        id,
        username,
        fullname,
        avatar
        )
    `)
    .single()

    if(updateError){
        throw new ApiError(
            500,
            updateError.message
        )
    }

    return res
       .status(200)
       .json(
        new ApiResponse(
            200,
            updatePlaylist,
            "Playlist updated successfully"
        )
       )
})

export { createPlaylist, getUserPlaylist, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist};