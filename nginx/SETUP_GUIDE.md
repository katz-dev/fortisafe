# FortiSafe Nginx Setup Guide with Cloudflare SSL

This guide will help you set up Nginx as a reverse proxy for your FortiSafe application using Cloudflare for SSL/TLS termination for both the frontend (app.fortisafe.live) and backend (api.fortisafe.live).

## Prerequisites

- A VPS with Ubuntu/Debian (or similar Linux distribution)
- Docker and Docker Compose installed
- A domain name (fortisafe.live) registered and configured with Cloudflare
- Root or sudo access to the server

## Step 1: Install Nginx

```bash
# Update package lists
sudo apt update

# Install Nginx
sudo apt install -y nginx
```

## Step 2: Set Up Cloudflare

1. Sign up for a Cloudflare account if you don't have one
2. Add your domain (fortisafe.live) to Cloudflare
3. Update your domain's nameservers to point to Cloudflare's nameservers
4. Wait for DNS propagation (can take up to 24 hours)

## Step 3: Configure Cloudflare DNS Records

In your Cloudflare dashboard:

1. Add the following DNS records:
   - Type: A, Name: app, Content: [Your VPS IP address], Proxy status: Proxied
   - Type: A, Name: api, Content: [Your VPS IP address], Proxy status: Proxied

2. Configure SSL/TLS settings:
   - Go to SSL/TLS tab
   - Set SSL/TLS encryption mode to "Full" or "Full (strict)"
   - Enable "Always Use HTTPS" in the Edge Certificates section

## Step 4: Configure Nginx

1. Copy the configuration files to the Nginx sites-available directory:

```bash
# Copy frontend configuration
sudo cp /path/to/app.fortisafe.live.conf /etc/nginx/sites-available/app.fortisafe.live

# Copy backend configuration
sudo cp /path/to/api.fortisafe.live.conf /etc/nginx/sites-available/api.fortisafe.live
```

2. Create symbolic links to enable the sites:

```bash
# Enable frontend site
sudo ln -s /etc/nginx/sites-available/app.fortisafe.live /etc/nginx/sites-enabled/

# Enable backend site
sudo ln -s /etc/nginx/sites-available/api.fortisafe.live /etc/nginx/sites-enabled/
```

3. Test the Nginx configuration:

```bash
sudo nginx -t
```

4. If the test is successful, restart Nginx:

```bash
sudo systemctl restart nginx
```

## Step 5: Update Environment Variables

1. Update your frontend environment variables:

```bash
# In your GitHub repository secrets, set:
NEXT_PUBLIC_BACKEND_URL=https://api.fortisafe.live
```

2. Update your backend environment variables:

```bash
# In your GitHub repository secrets, set:
FRONTEND_URL=https://app.fortisafe.live
AUTH0_CALLBACK_URL=https://api.fortisafe.live/api/auth/callback
```

## Step 6: Deploy Your Application

1. Push to your main branch or manually trigger the GitHub Actions workflow
2. The workflow will build and deploy your Docker containers
3. Nginx will proxy requests to the appropriate containers

## Step 7: Test Your Setup

1. Visit https://app.fortisafe.live in your browser
2. Verify that the frontend loads correctly
3. Test authentication and API functionality

## Troubleshooting

### Cloudflare SSL Issues

If you encounter SSL issues:

1. Verify your Cloudflare SSL/TLS settings
2. Make sure the SSL/TLS encryption mode is set to "Full" or "Full (strict)"
3. Check that your DNS records are properly configured and proxied through Cloudflare

### Nginx Configuration Issues

If Nginx fails to start:

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check syntax of configuration files
sudo nginx -t
```

### CORS Issues

If you encounter CORS issues:

1. Verify that the CORS headers in the api.fortisafe.live.conf file are correct
2. Ensure that the Origin header matches exactly (https://app.fortisafe.live)
3. Check Cloudflare's security settings, especially if you have Browser Integrity Check enabled

## Security Considerations

1. **Firewall**: Configure UFW or similar to only allow necessary ports (80 and SSH)
2. **Cloudflare Security**: Enable Cloudflare security features like:
   - Web Application Firewall (WAF)
   - Rate limiting
   - Bot protection
3. **Regular Updates**: Keep Nginx and your OS updated
4. **Monitoring**: Set up monitoring for your services

## Cloudflare Page Rules

Consider setting up the following page rules in Cloudflare:

1. Always Use HTTPS for all URLs
2. Browser Cache TTL settings for static assets
3. Cache level settings for API endpoints

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Cloudflare Documentation](https://developers.cloudflare.com/)
- [Docker Documentation](https://docs.docker.com/)
