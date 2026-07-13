import { cache } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const getCachedSession = cache(() => getServerSession(authOptions));
