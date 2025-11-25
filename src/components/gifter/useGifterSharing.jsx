import { base44 } from '@/api/base44Client';

export async function shareGifterData(preferences, subject, body) {
  const recipients = [];
  
  if (preferences?.share_songs_with_pixel) {
    recipients.push('PixelNutsCreative@gmail.com');
  }
  if (preferences?.song_share_email) {
    recipients.push(preferences.song_share_email);
  }
  
  if (recipients.length === 0) return false;
  
  try {
    for (const email of recipients) {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject,
        body
      });
    }
    return true;
  } catch (error) {
    console.error('Error sharing:', error);
    return false;
  }
}

export function formatGifterListForEmail(gifters) {
  if (!gifters || gifters.length === 0) return 'No gifters yet.';
  
  return gifters.map(g => 
    `• ${g.screen_name} (@${g.username})${g.phonetic ? ` - "${g.phonetic}"` : ''}`
  ).join('\n');
}

export function formatWeeklySummaryForEmail(entries, weekDate) {
  if (!entries || entries.length === 0) return 'No entries for this week.';
  
  const rankEmoji = { '1st': '🥇', '2nd': '🥈', '3rd': '🥉' };
  
  let text = `Weekly Summary for ${weekDate}:\n\n`;
  entries.forEach(entry => {
    text += `${rankEmoji[entry.rank] || '⭐'} ${entry.gifter_screen_name} (@${entry.gifter_username}) - ${entry.gift_name}\n`;
  });
  
  return text;
}

export function formatGiftLibraryForEmail(gifts) {
  if (!gifts || gifts.length === 0) return 'No gifts in library.';
  
  const byLeague = gifts.reduce((acc, gift) => {
    const league = gift.league_range || 'No League';
    if (!acc[league]) acc[league] = [];
    acc[league].push(gift.name);
    return acc;
  }, {});
  
  return Object.entries(byLeague)
    .map(([league, names]) => `${league}: ${names.join(', ')}`)
    .join('\n');
}