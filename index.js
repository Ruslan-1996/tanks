const root = document.querySelector('.root')

const allRounds = tanks.results.reduce((acc, cur) => {
    const curRound = cur.tournament_system_specific_data.round

    return curRound > acc ? curRound : acc
}, 1)

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
        // console.log(childrenGames)
        let firstGame = childrenGames?.[0];
        let secondGame = childrenGames?.[1];
        console.log(step);

        if(step === allRounds - 1) {
            console.log(step);
            if(!firstGame) {
                firstGame = {
                    "title": "пусто",
                }
            }
            if(!secondGame) {
                secondGame = {
                    "title": "пусто",
                }
            }

            data.children = [firstGame, secondGame];

            return data
        }

        if (childrenGames?.length) {
            data.children = childrenGames;
            data.step = step;
        }

        if (firstGame && (!firstGame?.team_2_id || !firstGame?.team_1_id)) {
            setChildren(firstGame, step + 1);
        }
        if (secondGame && (!secondGame?.team_2_id || !secondGame?.team_1_id)) {
            setChildren(secondGame, step + 1);
        }

        return data;
    };

    return setChildren(finalGame, step);
};

const render = () => {
    const htmlobj = {}
    const team = findTeams()

    const draw = (team) => {
        let el = ''
        team.children?.forEach((game) => {
            if(game) {
                el = el + `<div class='item ${game.uuid === '2518685@96' && 'red'}'>${game?.team_1?.title || 'н/и'} - ${game?.team_2?.title || 'н/и'}</div>`
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
