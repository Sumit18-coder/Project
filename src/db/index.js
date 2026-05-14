import {createClient} from "@supabase/supabase-js";
import {supabase} from "../config/supabase.js"

const connectDB = async () => {
    try{
        const {data, error} = await supabase
        .from("users")
        .select("*")
        .limit(1);

        if(error) throw error;

        console.log("Supabase Connected!!")
    }catch(error){
        console.log(
            "Supabase connection FAILEDA",
             error.message
        );
        process.exit(1);
    }
}
export {supabase}
export default connectDB;