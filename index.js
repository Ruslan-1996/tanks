const CARD_W = 220
const FINAL_W = 240
const CONN = 42
const CARD_H = 86
const SLOT = 102
const PAD_Y = 18
const X0 = -1
const X1 = CONN + 1

const MEDAL = `<svg class="medal" viewBox="0 0 64 76" width="56" height="66" aria-hidden="true">
  <path d="M22 2h8l1.5 16h-11z" fill="#7c1e24"/>
  <path d="M34 2h8l-1.5 16h-11z" fill="#c44545"/>
  <circle cx="32" cy="46" r="20" fill="#241c10" stroke="#e2c48a" stroke-width="2.4"/>
  <circle cx="32" cy="46" r="15.5" fill="none" stroke="#8a6a32" stroke-width="1"/>
  <path fill="#f3e2b8" d="M32 34.2 34.8 40l6.4.8-4.7 4.4 1.2 6.3L32 48.4l-5.7 3.1 1.2-6.3-4.7-4.4 6.4-.8z"/>
</svg>`

let ROWS = 1

const byParent = new Map()
for (const match of tanks.results) {
    const next = match.tournament_system_specific_data.next_match_for_winner_uuid
    if (!next) continue
    if (!byParent.has(next)) byParent.set(next, [])
    byParent.get(next).push(match)
}
for (const list of byParent.values()) {
    list.sort((a, b) => a.tournament_system_specific_data.position - b.tournament_system_specific_data.position)
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]))
}

function childrenOf(match) {
    return byParent.get(match.uuid) || []
}

function isPlayin(match) {
    const next = match.tournament_system_specific_data.next_match_for_winner_uuid
    if (!next) return false
    return (byParent.get(next) || []).length === 1
}

function mainChildren(match) {
    return childrenOf(match).filter((child) => !isPlayin(child))
}

function playinOf(match) {
    const kids = childrenOf(match)
    return kids.length === 1 ? kids[0] : null
}

function mainLevels(root) {
    const levels = []
    const seen = new Set()
    let layer = [root]
    while (layer.length) {
        levels.push(layer)
        const next = []
        for (const match of layer) {
            for (const child of mainChildren(match)) {
                if (seen.has(child.uuid)) continue
                seen.add(child.uuid)
                next.push(child)
            }
        }
        if (!next.length) break
        layer = next
    }
    return levels.reverse()
}

function centerY(index, count) {
    const span = (ROWS * SLOT) / count
    return PAD_Y + (index + 0.5) * span
}

function laneHeight() {
    return ROWS * SLOT + PAD_Y * 2
}

function roundName(round) {
    if (round <= 1) return 'Финал'
    return `1/${2 ** (round - 1)}`
}

function winnersRoot(finalMatch) {
    const kids = childrenOf(finalMatch)
    const positive = kids.filter((match) => match.tournament_system_specific_data.round > 0)
    const negative = kids.filter((match) => match.tournament_system_specific_data.round < 0)
    if (positive.length === 1 && negative.length) return positive[0]
    return finalMatch
}

function battlesLabel(count) {
    const mod10 = count % 10
    const mod100 = count % 100
    if (mod10 === 1 && mod100 !== 11) return `${count} бой`
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} боя`
    return `${count} боёв`
}

function splitTitle(title) {
    const match = String(title).match(/^\[([^\]]+)\]\s*(.*)$/)
    if (!match) return { tag: '', name: String(title) }
    const tag = match[1]
    const name = match[2].trim() || tag
    return { tag, name }
}

function initials(tag, name) {
    const raw = (tag || name).replace(/[^0-9A-Za-zА-Яа-яЁё]/g, '')
    return (raw.slice(0, 2) || '•').toUpperCase()
}

function formatTime(start) {
    const stamp = Number(start)
    if (!stamp) return ''
    const date = new Date(stamp * 1000)
    if (Number.isNaN(date.getTime()) || date.getFullYear() < 2010) return ''
    return date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function leadingSide(match) {
    if (match.winner_team_id != null) {
        if (String(match.winner_team_id) === String(match.team_1_id)) return 1
        if (String(match.winner_team_id) === String(match.team_2_id)) return 2
    }
    const left = match.extra_data?.wins_team_1
    const right = match.extra_data?.wins_team_2
    if (left == null || right == null || left === right) return 0
    return left > right ? 1 : 2
}

function teamRow(match, side) {
    const team = side === 1 ? match.team_1 : match.team_2
    const title = team?.title
    const wins = side === 1 ? match.extra_data?.wins_team_1 : match.extra_data?.wins_team_2
    const lead = leadingSide(match)
    const score = wins == null ? '' : String(wins)

    if (!title) {
        const pending = playinOf(match) ? 'из стыка' : 'ожидание'
        const feeder = pending === 'из стыка' ? ' is-feeder' : ''
        return `<div class="team is-empty${feeder}">
            <span class="badge" aria-hidden="true"></span>
            <span class="who"><span class="name">${pending}</span></span>
            <span class="score"></span>
        </div>`
    }

    const parts = splitTitle(title)
    const state = lead === side ? ' is-winner' : lead ? ' is-loser' : ''
    const tag = parts.tag && parts.name !== parts.tag
        ? `<span class="tag">[${esc(parts.tag)}]</span>`
        : ''

    return `<div class="team${state}" title="${esc(title)}">
        <span class="badge" aria-hidden="true">${esc(initials(parts.tag, parts.name))}</span>
        <span class="who">${tag}<span class="name">${esc(parts.name)}</span></span>
        <span class="score">${esc(score)}</span>
    </div>`
}

function cardHtml(match, kind) {
    const map = match.settings?.map || ''
    const when = formatTime(match.start_at)
    const mapLabel = kind === 'playin' ? (map ? `Стык · ${map}` : 'Стык') : map
    const pending = playinOf(match) ? 'из стыка' : 'ожидание'
    const left = match.team_1?.title || pending
    const right = match.team_2?.title || pending
    const tip = [`${left} — ${right}`, map, when].filter(Boolean).join(' · ')
    const medal = kind === 'final' ? MEDAL : ''
    const mapBody = mapLabel ? `<i></i><span>${esc(mapLabel)}</span>` : ''

    return `${medal}<article class="match ${kind || ''}" title="${esc(tip)}" aria-label="${esc(tip)}">
        ${teamRow(match, 1)}
        ${teamRow(match, 2)}
        <div class="map${mapLabel ? '' : ' is-empty'}">${mapBody}</div>
    </article>`
}

function elbow(side, y1, y2, yp) {
    const mid = CONN / 2
    if (side === 'left') {
        return `M ${X0} ${y1} H ${mid} V ${y2} H ${X0} M ${mid} ${yp} H ${X1}`
    }
    return `M ${X1} ${y1} H ${mid} V ${y2} H ${X1} M ${mid} ${yp} H ${X0}`
}

function forkSpec(side, childCount) {
    const parts = []
    const dots = []
    const pairs = Math.floor(childCount / 2)
    for (let index = 0; index < pairs; index += 1) {
        const y1 = centerY(index * 2, childCount)
        const y2 = centerY(index * 2 + 1, childCount)
        const yp = (y1 + y2) / 2
        parts.push(elbow(side, y1, y2, yp))
        dots.push(yp)
    }
    if (childCount % 2 === 1) {
        const y = centerY(childCount - 1, childCount)
        parts.push(`M ${X0} ${y} H ${X1}`)
    }
    return { d: parts.join(' '), dots }
}

function straightSpec(items) {
    const parts = items.map((item, index) => {
        if (!item) return ''
        const y = centerY(index, items.length)
        return `M ${X0} ${y} H ${X1}`
    })
    return { d: parts.filter(Boolean).join(' '), dots: [] }
}

function midSpec() {
    const y = centerY(0, 1)
    return { d: `M ${X0} ${y} H ${X1}`, dots: [] }
}

function matchCol(matches, label, sub, kind) {
    return {
        type: 'matches',
        matches,
        label,
        sub,
        kind,
        width: kind === 'final' ? FINAL_W : CARD_W,
    }
}

function connCol(spec) {
    return { type: 'conn', width: CONN, d: spec.d, dots: spec.dots }
}

function buildLinear(root) {
    const levels = mainLevels(root)
    const cols = []
    const playins = levels[0].map(playinOf)
    if (playins.some(Boolean)) {
        const count = playins.filter(Boolean).length
        cols.push(matchCol(playins, 'Стыки', battlesLabel(count), 'playin'))
        cols.push(connCol(straightSpec(playins)))
    }
    levels.forEach((level, index) => {
        const round = level[0].tournament_system_specific_data.round
        const isFinal = index === levels.length - 1
        cols.push(matchCol(
            level,
            isFinal ? 'Финал' : roundName(round),
            isFinal ? 'кубок' : '',
            isFinal ? 'final' : '',
        ))
        if (!isFinal) cols.push(connCol(forkSpec('left', level.length)))
    })
    return cols
}

function buildMirrored(leftRoot, rightRoot, finalMatch) {
    const leftLevels = mainLevels(leftRoot)
    const rightLevels = mainLevels(rightRoot)
    const cols = []
    const leftPlayins = leftLevels[0].map(playinOf)
    const rightPlayins = rightLevels[0].map(playinOf)
    const showPlayin = leftPlayins.some(Boolean) || rightPlayins.some(Boolean)

    if (showPlayin) {
        const count = leftPlayins.filter(Boolean).length
        cols.push(matchCol(leftPlayins, 'Стыки', count ? battlesLabel(count) : '—', 'playin'))
        cols.push(connCol(straightSpec(leftPlayins)))
    }

    leftLevels.forEach((level, index) => {
        const round = level[0].tournament_system_specific_data.round
        cols.push(matchCol(level, roundName(round), '', ''))
        if (index < leftLevels.length - 1) cols.push(connCol(forkSpec('left', level.length)))
    })

    cols.push(connCol(midSpec()))
    cols.push(matchCol([finalMatch], 'Финал', 'кубок', 'final'))
    cols.push(connCol(midSpec()))

    const rightInner = rightLevels.slice().reverse()
    rightInner.forEach((level, index) => {
        const round = level[0].tournament_system_specific_data.round
        cols.push(matchCol(level, roundName(round), '', ''))
        const next = rightInner[index + 1]
        if (next) cols.push(connCol(forkSpec('right', next.length)))
    })

    if (showPlayin) {
        const count = rightPlayins.filter(Boolean).length
        cols.push(connCol(straightSpec(rightPlayins)))
        cols.push(matchCol(rightPlayins, 'Стыки', count ? battlesLabel(count) : '—', 'playin'))
    }

    return cols
}

function connectorSvg(d, dots) {
    const mid = CONN / 2
    const marks = dots.map((y) => `<g transform="translate(${mid} ${y}) rotate(45)">
        <rect x="-3.2" y="-3.2" width="6.4" height="6.4" fill="#3a2c14"/>
        <rect x="-2.1" y="-2.1" width="4.2" height="4.2" fill="#f6e3b4"/>
    </g>`).join('')

    return `<svg class="wires" viewBox="0 0 ${CONN} ${laneHeight()}" width="${CONN}" height="${laneHeight()}" aria-hidden="true">
        <path d="${d}" class="wire-shadow"/>
        <path d="${d}" class="wire"/>
        ${marks}
    </svg>`
}

function headHtml(col) {
    if (col.type !== 'matches') {
        return `<div class="head head-gap" style="width:${col.width}px"></div>`
    }
    return `<div class="head ${col.kind || ''}" style="width:${col.width}px">
        <span>${esc(col.label)}</span>
        <small>${esc(col.sub || '')}</small>
    </div>`
}

function laneHtml(col) {
    if (col.type === 'conn') {
        return `<div class="conn" style="width:${col.width}px">${connectorSvg(col.d, col.dots)}</div>`
    }
    const count = col.matches.length
    const cards = col.matches.map((match, index) => {
        if (!match) return ''
        const top = centerY(index, count) - CARD_H / 2
        return `<div class="slot" style="top:${top}px">${cardHtml(match, col.kind)}</div>`
    }).join('')
    return `<div class="col ${col.kind || ''}" style="width:${col.width}px">${cards}</div>`
}

function routeLabels() {
    const counts = new Map()
    for (const match of tanks.results) {
        const round = match.tournament_system_specific_data.round
        if (round < 1) continue
        counts.set(round, (counts.get(round) || 0) + 1)
    }
    return [...counts.keys()].sort((a, b) => b - a).map((round) => {
        if (round === 1) return 'Финал'
        const full = 2 ** (round - 1)
        if (counts.get(round) < full) return 'Стыки'
        return roundName(round)
    })
}

function teamCount() {
    const names = new Set()
    for (const match of tanks.results) {
        if (match.team_1?.title) names.add(match.team_1.title)
        if (match.team_2?.title) names.add(match.team_2.title)
    }
    return names.size
}

function render() {
    const board = document.getElementById('board')
    const grandFinal = tanks.results.find(
        (match) => !match.tournament_system_specific_data.next_match_for_winner_uuid,
    )

    document.getElementById('stat-teams').textContent = String(teamCount())
    document.getElementById('stat-matches').textContent = String(tanks.results.length)
    document.getElementById('route').innerHTML = routeLabels().map((label) => `<span>${esc(label)}</span>`).join('')

    if (!grandFinal) {
        board.innerHTML = '<p class="empty-note">В этой группе нет финала, сетку не из чего собрать.</p>'
        return
    }

    const finalMatch = winnersRoot(grandFinal)
    const upperOnly = finalMatch !== grandFinal
    const semis = mainChildren(finalMatch)
    let cols
    if (semis.length === 2) {
        ROWS = Math.max(mainLevels(semis[0])[0].length, mainLevels(semis[1])[0].length)
        cols = buildMirrored(semis[0], semis[1], finalMatch)
        if (upperOnly) {
            const center = cols.find((col) => col.kind === 'final')
            if (center) center.sub = 'верхняя сетка'
        }
    } else {
        const levels = mainLevels(finalMatch)
        ROWS = levels[0].length
        cols = buildLinear(finalMatch)
    }

    board.innerHTML = `
        <div class="heads">${cols.map(headHtml).join('')}</div>
        <div class="lanes" style="height:${laneHeight()}px">${cols.map(laneHtml).join('')}</div>
    `

}

render()
