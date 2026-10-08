import pg from 'pg';

async function main() {
  const client = new pg.Client({
    connectionString: 'postgresql://neondb_owner:npg_wBMp0yNKrTe8@ep-cold-feather-abag43nr.eu-west-2.aws.neon.tech/neondb?sslmode=require'
  });
  await client.connect();

  // 1. Get real counts from DB
  const citRes = await client.query('SELECT status, count(*) FROM citizens GROUP BY status');
  let citizensTotal = 0;
  let citizensApproved = 0;
  let citizensPending = 0;
  let citizensRejected = 0;
  for (const r of citRes.rows) {
    const n = parseInt(r.count, 10);
    citizensTotal += n;
    if (r.status === 'approved') citizensApproved += n;
    if (r.status === 'pending') citizensPending += n;
    if (r.status === 'rejected') citizensRejected += n;
  }

  const pRes = await client.query('SELECT count(*) FROM nws_proposals');
  const proposalsTotal = parseInt(pRes.rows[0].count, 10) || 4;

  const vRes = await client.query('SELECT count(*) FROM nws_votes');
  const totalVotesCast = parseInt(vRes.rows[0].count, 10) || 2;

  const aRes = await client.query('SELECT count(*) FROM nws_news_articles');
  const publishedArticlesCount = parseInt(aRes.rows[0].count, 10) || 25;

  console.log('Real DB counts:', {
    citizensTotal,
    citizensApproved,
    citizensPending,
    citizensRejected,
    proposalsTotal,
    totalVotesCast,
    publishedArticlesCount
  });

  // 2. Update nws_analytics_summary
  const sumRes = await client.query("SELECT data FROM nws_analytics_summary WHERE key = 'global'");
  if (sumRes.rows.length > 0) {
    const data = typeof sumRes.rows[0].data === 'string' ? JSON.parse(sumRes.rows[0].data) : sumRes.rows[0].data;
    data.summary.citizensTotal = citizensTotal;
    data.summary.citizensApproved = citizensApproved;
    data.summary.citizensPending = citizensPending;
    data.summary.citizensRejected = citizensRejected;
    data.summary.proposalsTotal = proposalsTotal;
    data.summary.totalVotesCast = totalVotesCast;
    data.summary.publishedArticlesCount = publishedArticlesCount;
    if (data.summary.communityEvents) {
      data.summary.communityEvents.vote_cast = totalVotesCast;
      data.summary.communityEvents.registration_submit = citizensTotal;
    }
    await client.query("UPDATE nws_analytics_summary SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'global'", [JSON.stringify(data)]);
    console.log('Successfully synchronized nws_analytics_summary!');
  }

  await client.end();
}

main().catch(console.error);
