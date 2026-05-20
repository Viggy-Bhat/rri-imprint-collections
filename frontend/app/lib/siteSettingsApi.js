import { getWagtailBackendBaseUrl } from "@/app/lib/config";

const WAGTAIL_BACKEND_BASE = getWagtailBackendBaseUrl();

export async function getSiteSettings() {
  try {
    const response = await fetch(`${WAGTAIL_BACKEND_BASE}/api/site-settings/`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return {
        institute_name: "",
        department: "",
        address: "",
        phone: "",
        email: "",
      };
    }

    const data = await response.json();

    return {
      institute_name: data?.institute_name || "",
      department: data?.department || "",
      address: data?.address || "",
      phone: data?.phone || "",
      email: data?.email || "",
    };
  } catch {
    return {
      institute_name: "",
      department: "",
      address: "",
      phone: "",
      email: "",
    };
  }
}
