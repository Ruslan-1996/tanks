// let tournamentValue = localStorage.getItem('tournamentValue') || 31446;
// let stageValue = localStorage.getItem('stageValue') || 75563;
// let groupValue = localStorage.getItem('groupValue') || 2515057 ;
//
// console.log(localStorage.getItem('tournamentValue'));
//
// document.getElementById("tournamentId").value = tournamentValue;
// document.getElementById("stageId").value = stageValue;
// document.getElementById("groupId").value = groupValue;
// const tournamentId = document.getElementById("tournamentId").oninput = (e) => {
//     const value = e.target.value;
//
//     tournamentValue = value
//     localStorage.setItem('tournamentValue', value)
// }
// const stageId = document.getElementById("stageId").oninput = (e) => {
//     const value = e.target.value;
//
//     stageValue = value
//     localStorage.setItem('stageValue', value)
// }
// const groupId = document.getElementById("groupId").oninput = (e) => {
//     const value = e.target.value;
//
//     groupValue = value
//     localStorage.setItem('groupValue', value)
// }
//
// document.getElementById('btn').onclick = () => {
//     if(tournamentId && groupId && stageId) {
//         fetch(`https://tanki.su/tmsis/api/v1/stages/groups/matches/?filter%5Blanguage%5D=ru&filter%5Btournament_id%5D=${tournamentValue.trim()}&filter%5Bstage_id%5D=${stageValue.trim()}&filter%5Bgroup_id%5D=${groupValue.trim()}`)
//             .then(res => res.json())
//             .then(data => {
//                 if(data.status === 'ok') {
//                     tanks = data.data
//                     localStorage.setItem('tanks', JSON.stringify(data.data))
//
//                     render()
//                 } else {
//                     alert('Ошибка')
//                 }
//             }).catch(err => alert('Ошибка'))
//     } else {
//         const err = []
//
//         if (!tournamentId) {
//             err.push("tournamentId")
//         }
//
//         if(stageId) {
//             err.push("stageId")
//         }
//
//         if(groupId) {
//             err.push('groupId')
//         }
//
//         alert(`Не введен ${err.join(', ')}`)
//     }
// }
//