import {
  logout,
  verifyRequestOrigin
} from '@netlify/identity';

export default async (req) => {
  try {
    verifyRequestOrigin(req);

    await logout();

    return Response.json({
      ok: true
    });

  } catch (error) {
    console.error('LOGOUT ERROR:', error);

    return Response.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
};
