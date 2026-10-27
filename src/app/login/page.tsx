import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
export const metadata: Metadata = { title: "Log in", description: "Log in to ToolHub to sync favorites." };
export default function Page() { return <AuthForm mode="login" />; }
