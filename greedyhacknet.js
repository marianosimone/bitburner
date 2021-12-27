/** @param {NS} ns **/

/**
 * A trivial greedy algorithm to build up a basic node-based Hacknet
 * to passively earn money
**/

const maxDesiredNodes = 30;

const money = (amount) => amount.toLocaleString(
    'en-US', { style: 'currency', currency: 'USD' }
)

const range = (start, end) => {
    const length = end - start;
    return Array.from({ length }, (_, i) => start + i);
}

export async function main(ns) {
    ns.disableLog('sleep');
    ns.disableLog('getServerMoneyAvailable');

    const ptoast = (message) => {
        ns.print(message);
        ns.toast(message);
    }

    while (true) {
        const currentNodes = ns.hacknet.numNodes();
        const options = range(0, currentNodes)
            .map(i => {
                const stats = ns.hacknet.getNodeStats(i);
                return {node: i, stats};
            })
            .flatMap(data => {
                return [
                    {
                        desc: 'level (x5)',
                        node: data.node,
                        purchase: () => ns.hacknet.upgradeLevel(data.node, 5),
                        cost: ns.hacknet.getLevelUpgradeCost(data.node, 5),
                    },
                    {
                        desc: 'RAM',
                        node: data.node,
                        purchase: () => ns.hacknet.upgradeRam(data.node, 1),
                        cost: ns.hacknet.getRamUpgradeCost(data.node, 1),
                    },
                    {
                        desc: 'core',
                        node: data.node,
                        purchase: () => ns.hacknet.upgradeCore(data.node, 1),
                        cost: ns.hacknet.getCoreUpgradeCost(data.node, 1),
                    },
                ]
                .filter(d => d.cost !== 0);
            });

        if (currentNodes < maxDesiredNodes && currentNodes < ns.hacknet.maxNumNodes()) {
            options.push({
                desc: 'node',
                node: currentNodes,
                purchase: () => ns.hacknet.purchaseNode(),
                cost: ns.hacknet.getPurchaseNodeCost(),
            })
        }

        if (options.length > 0) {
            ns.print(`Have ${options.length} options to try out`);
        } else {
            ns.print('No more options to try out');
            break;
        }

        const minOption = options.reduce((seed,item) => { return (seed && seed.cost < item.cost) ? seed : item; }, null);
        const currentMoney = ns.getServerMoneyAvailable('home');

        if (minOption.cost <= currentMoney) {
            minOption.purchase();
            ptoast(`Got another ${minOption.desc} for ${minOption.node}`);
            await ns.sleep(2000);
        } else {
            ns.print(`Couldn't purchase anything, so waiting for longer (need at least ${money(minOption.cost)})`);
            await ns.sleep(5000);
        }
    }
};
