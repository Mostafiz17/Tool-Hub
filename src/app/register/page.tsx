import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
export const metadata: Metadata = { title: "Create account", description: "Create a free ToolHub account to sync favorites." };
export default function Page() { return <AuthForm mode="register" />; }
