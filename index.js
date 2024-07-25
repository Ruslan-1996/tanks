const root = document.querySelector('.root')

const findTeams = () => {
    const finalGame = tanks.results.find(
        (game) => !game.tournament_system_specific_data.next_match_for_winner_uuid,
    );

    let step = 1

    const setChildren = (game, step) => {
        const data = game;

        const childrenGames = tanks.results.filter(
            (newGame) =>
                newGame.tournament_system_specific_data.next_match_for_winner_uuid ===
                data?.uuid,
        );

        const firstGame = childrenGames?.[0];
        const secondGame = childrenGames?.[1];

        if (childrenGames?.length) {
            data.children = childrenGames;
            data.step = step;
        }
        if(firstGame?.uuid && tanks?.results.find((game) => game.tournament_system_specific_data.next_match_for_winner_uuid === firstGame.uuid)) {
            setChildren(firstGame, step + 1);
        }

        if(secondGame?.uuid && tanks?.results.find((game) => game.tournament_system_specific_data.next_match_for_winner_uuid === secondGame.uuid)) {
            setChildren(secondGame, step + 1);
        }

        return data;
    };

    return setChildren(finalGame, step);
};

const render = () => {
    const htmlobj = {}

    const team = findTeams()

    const teamName = 'WhoCares?'
    const nextMatchId = tanks.results.find(({team_2, team_1}) => team_2.title === teamName || team_1.title === teamName)?.tournament_system_specific_data.next_match_for_winner_uuid

    const draw = (team) => {
        let el = ''
        team.children?.forEach((game) => {
            if(game) {
                el = el + `<div class='item ${game.uuid === nextMatchId && 'red'}'>${game?.team_1?.title || 'н/и'} - ${game?.team_2?.title || 'н/и'}</div>`
            }
        })

        if(htmlobj[team.step]) {
            htmlobj[team.step] += el
        } else {
            htmlobj[team.step] = el
        }

        team.children?.forEach((game) => {
            if(game) {
                draw(game)
            }
        })
    }

    draw(team)

    root.innerHTML = Object.values(htmlobj).map((value) => `<div class="row">${value}</div>`).join('')
}

render()
