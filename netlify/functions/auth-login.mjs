import {
  login,
  verifyRequestOrigin
} from '@netlify/identity';

export default async (req) => {
  try {
    verifyRequestOrigin(req);

    if (req.method !== 'POST') {
      return Response.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await login(email, password);

    return Response.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);

    return Response.json(
      {
        ok: false,
        error: 'Invalid email or password'
      },
      { status: 401 }
    );
  }
};
