/**
 * A way to display all reachable servers, along with some metadata to help decide
 * what to do next.
 * Initially developed by DeadRights (https://www.reddit.com/user/DeadRights/) in https://pastebin.com/e70JauZ1
**/
const doc = eval("document")
const factions = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "w0r1d_d43m0n"]
const tprint = html => doc.getElementById("terminal").insertAdjacentHTML('beforeend', `<li>${html}</li>`);

const setUpCSS = () => {
    const css = `<style id="mapCSS">
        .sc {white-space:pre; color:#ccc; font:14px monospace; line-height: 16px; }
        .sc .s {color:#080;cursor:pointer;text-decoration:underline}
        .sc .f {color:#088}
        .sc .r {color:#6f3}
        .sc .nr::after {display: inline-block; content:' 🔒'; text-decoration:none}
        .sc .nrb::after {display: inline-block; content:' 🔒🚪'; text-decoration:none}
        .sc .rb::after {display: inline-block; content:' 🚪'; text-decoration:none}
        .sc .r.f {color:#0ff}
        .sc .f::before {display: inline-block; content:'✊ '; text-decoration:none}
        .sc .r::before {color:#693}
        .sc .hack {display:inline-block; font:12px monospace}
        .sc .green {color:green;}
        .sc .red {color:red;}
    </style>`
    const previousCss = doc.getElementById('mapCSS');
    if (previousCss) {
        previousCss.remove();
    }
    doc.head.insertAdjacentHTML('beforeend', css);
};

/** @param {NS} ns **/
export const main = ns => {
    setUpCSS();
    const tIn = doc.getElementById("terminal-input")
    const tEv = tIn[Object.keys(tIn)[1]];
    const servers = ["home"]
    const path = [""]
    const r = { home: "home" }
    const myHack = ns.getHackingLevel()

    const fName = x => {
        const reqHack = ns.getServerRequiredHackingLevel(x);
        const hasRootAccess = ns.hasRootAccess(x);
        const classes = ['s'];
        if (factions.includes(x)) {
            classes.push('f');
        }
        const backdoorClass = ns.getServer(x).backdoorInstalled || x === 'home' ? '' : 'b';
        if (hasRootAccess) {
            classes.push(`r${backdoorClass}`);
        } else {
            classes.push(`nr${backdoorClass}`);
        }
        return `<a class="${classes.join(' ')}">${x}</a>` +
            (hasRootAccess && myHack >= reqHack ? '' : ` <span class="hack ${myHack >= reqHack ? 'green' : 'red'}">(${reqHack})</span>`) +
            `${' 💼'.repeat(ns.ls(x, ".cct").length)}`;
    };

    const tcommand = x => {
        tIn.value = x;
        tEv.onChange({ target: tIn });
        tEv.onKeyDown({ keyCode: "13", preventDefault: () => 0 });
    };

    const addSc = (x = servers[0], p1 = ["\n"], o = p1.join("") + fName(x)) => {
        for (let i = 0; i < servers.length; i++) {
            if (path[i] != x) continue;
            let p2 = p1.slice();
            p2[p2.length - 1] = p2[p2.push(path.slice(i + 1).includes(path[i]) ? "├╴" : "└╴") - 2].replace("├╴", "│ ").replace("└╴", "  ");
            o += addSc(servers[i], p2);
        }
        return o;
    };

    for (let i = 0, j; i < servers.length; i++) {
        for (j of ns.scan(servers[i])) {
            if (!servers.includes(j)) {
                servers.push(j);
                path.push(servers[i]);
                r[j] = r[servers[i]] + "; connect " + j;
            }
        }
    }
    tprint(`<div class="sc new">${addSc()}</div>`);
    doc.querySelectorAll(".sc.new .s").forEach(q => q.addEventListener('click', tcommand.bind(null, r[q.childNodes[0].nodeValue])));
    doc.querySelector(".sc.new").classList.remove("new");
};