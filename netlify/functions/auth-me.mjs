import { getUser } from '@netlify/identity';

export default async () => {
  try {
    const user = await getUser();

    if (!user) {
      return Response.json({
        authenticated: false
      });
    }

    return Response.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || null
      }
    });

  } catch (error) {
    console.error('AUTH ME ERROR:', error);

    return Response.json(
      {
        authenticated: false,
        error: 'Authentication check failed'
      },
      { status: 500 }
    );
  }
};
