import { redirect } from "next/navigation";

export default function ExcludedPage() {
  redirect("/inbox?filter=fails_hard_filters");
}
