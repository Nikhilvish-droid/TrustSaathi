function inferDonorCategory(name, donationCount, firstDonationDate) {
  const lower = name.toLocaleLowerCase('en-US');
  if (lower.includes('trust')) return 'Trust';
  if (
    ['foundation', 'charitable', 'sanstha', 'ngo', ' ltd', 'pvt', 'private limited'].some((kw) =>
      lower.includes(kw),
    )
  ) {
    return 'Corporate';
  }
  if (donationCount > 1) return 'Repeat';

  const first = firstDonationDate ? new Date(firstDonationDate) : null;
  if (first && !Number.isNaN(first.getTime())) {
    const now = new Date();
    const isThisMonth =
      first.getMonth() === now.getMonth() && first.getFullYear() === now.getFullYear();
    if (donationCount === 1 && isThisMonth) return 'New';
  }

  return donationCount === 1 ? 'New' : 'Repeat';
}

function matchesFilter(category, donationCount, firstDonationDate, filter) {
  if (!filter || filter === 'all') return true;

  const first = firstDonationDate ? new Date(firstDonationDate) : null;
  const now = new Date();
  const isFirstThisMonth =
    first &&
    !Number.isNaN(first.getTime()) &&
    first.getMonth() === now.getMonth() &&
    first.getFullYear() === now.getFullYear();

  switch (filter.toLowerCase()) {
    case 'repeat':
      return donationCount > 1;
    case 'new':
      return donationCount === 1 && isFirstThisMonth;
    case 'corporate':
      return category === 'Corporate';
    case 'trust':
      return category === 'Trust';
    default:
      return true;
  }
}

function donorScopeSql(orgParamIndex) {
  return `
    FROM donors dr
    INNER JOIN donations don ON don.donor_id = dr.id AND don.organization_id = dr.organization_id
    WHERE dr.organization_id = $${orgParamIndex}
  `;
}

module.exports = { inferDonorCategory, matchesFilter, donorScopeSql };
