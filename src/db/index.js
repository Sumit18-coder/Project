import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import ws from "ws";

dotenv.config({
    path: './.env'
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
        realtime: {
            transport: ws
        }
    }
);

const connectDB = async () => {
    try {

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .limit(1);

        if (error) {
            throw error;
        }

        console.log("Supabase connected successfully");

    } catch (error) {

        console.log(
            "Supabase connection FAILED",
            error.message
        );

        process.exit(1);
    }
};

export {
    supabase
};

export default connectDB;