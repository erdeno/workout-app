const { sql } = require('./lib/db');

exports.handler = async () => {
  try {
    const result = await sql`
      SELECT NOW() AS current_time
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: true,
        databaseTime: result[0].current_time
      })
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: 'Database connection failed'
      })
    };
  }
};
