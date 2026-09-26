import {
  signup,
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

    const { email, password, name } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await signup(
      email,
      password,
      {
        full_name: name || ''
      }
    );

    return Response.json({
      ok: true,
      message: 'Account created. Check your email to confirm your account.',
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('SIGNUP ERROR:', error);

    return Response.json(
      {
        ok: false,
        error: error.message || 'Registration failed'
      },
      { status: 400 }
    );
  }
};
