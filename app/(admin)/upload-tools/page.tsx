// app/(admin)/upload-tools/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ToolsAdminPage from "./client";

export default async function UploadToolsPage() {
  const { userId } = await auth();

  if (userId !== "user_302MQjtmYac7aB1JKBeHcjTAbeV") {
    redirect('/');
  }

  return <ToolsAdminPage />;
}
