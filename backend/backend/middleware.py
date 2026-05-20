class ApiSecurityHeadersMiddleware:
    """
    Apply additional security headers to API routes only.
    This avoids interfering with Wagtail admin/editor assets.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.path.startswith("/api/"):
            response.setdefault(
                "Content-Security-Policy",
                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
            )
            response.setdefault("Referrer-Policy", "same-origin")
            response.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
            response.setdefault("X-Content-Type-Options", "nosniff")
            response.setdefault("X-Frame-Options", "DENY")

        return response
