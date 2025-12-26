/**
 * Cloudflare Workers function to handle GitHub OAuth token exchange
 * 
 * This function runs on Cloudflare Pages/Workers edge network
 * No need for a separate backend server!
 */

interface Env {
  KV?: KVNamespace
  CLIENT_ID: string
  CLIENT_SECRET: string
}

async function getToken(
  code: string,
  client_id: string,
  client_secret: string
) {
  const query = `code=${code}&client_id=${client_id}&client_secret=${client_secret}`
  const url = 'https://github.com/login/oauth/access_token?' + query
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  })
  const body = await res.json<any>()
  if (!body.access_token) throw 'access_token empty'
  return body
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const url = new URL(request.url)
  const code = url.searchParams.get('code') || ''
  
  if (!code) {
    return new Response(JSON.stringify({ error: 'Missing code parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const tokenData = await getToken(code, env.CLIENT_ID, env.CLIENT_SECRET)
    
    // Generate a simple app token (you can customize this)
    const appToken = `app_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return Response.json({
      token: appToken,
      token_type: tokenData.token_type || 'token',
      access_token: tokenData.access_token
    })
  } catch (error) {
    console.error('OAuth error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to exchange token' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

