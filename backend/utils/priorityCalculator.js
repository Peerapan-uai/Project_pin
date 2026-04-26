const BASE_SCORE = {
    safety: 5, no_charge: 4, 
    payment: 4, 
    physical_damage: 3, 
    display: 2, 
    other: 3
}

async function calculatePriority(issue_type, charger_id, db) {
    let score = BASE_SCORE[issue_type] ?? 1

    if (issue_type === 'safety') return 'critical'

 const [[ctx]] = await db.query(`
    select s.station_type, count(c.charger_id) AS total, sum(c.status = 'available') AS available, 
    (select count(*) from maintenance_tickets where charger_id = ? and created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)) as repeat_count from chargers c join stations s using (station_id) where c.charger_id = ? group by s.station_id`, [charger_id, charger_id])
    
    if (!ctx) return 'medium'

    if (ctx.station_type === 'private_fleet') {
        score = Math.max(score * 1.5, 4)
    } else {
        const ratio = (ctx.available ?? 0) / (ctx.total || 1)
        if (ratio <= 0.25)     score *= 1.4
        else if (ratio <= 0.5) score *= 1.2
    }

    if (ctx.repeat_count >= 2) score *= 1.3

    if (score >= 5)   return 'critical'
    if (score >= 3.5) return 'high'
    if (score >= 2)   return 'medium'
    return 'low'
}

module.exports = { calculatePriority }

