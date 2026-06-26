import { auth } from "@/auth"
import { redirect } from "next/navigation"
import OnboardingFlow from "./onboarding-flow"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session) redirect("/")
  return <OnboardingFlow />
}
