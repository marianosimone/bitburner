/** @param {NS} ns **/

/**
 * A trivial greedy algorithm to build up a basic node-based Hacknet
 * to passively earn money
**/

const maxDesiredNodes = 30;

const range = (start, end) => {
    const length = end - start;
    return Array.from({ length }, (_, i) => start + i);
}

/**
 * This is taken from:
 * https://github.com/danielyxie/bitburner/blob/504a8a4be5a7aacf9847e065f5d4add8bb68ecd0/src/Hacknet/formulas/HacknetNodes.ts#L4-L11
 *
 * The big difference is that we don't care about multipliers, as they would remain
 * constant for any comparison that we'd be making anyway
 */
const calculateMoneyGainRate = (level, ram, cores) => {
  const gainPerLevel = 1.5;
  const levelMult = level * gainPerLevel;
  const ramMult = Math.pow(1.035, ram - 1);
  const coresMult = (cores + 5) / 6;
  return levelMult * ramMult * coresMult;
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
                        rate: calculateMoneyGainRate(data.stats.level + 5, data.stats.ram, data.stats.cores),
                    },
                    {
                        desc: 'RAM',
                        node: data.node,
                        purchase: () => ns.hacknet.upgradeRam(data.node, 1),
                        cost: ns.hacknet.getRamUpgradeCost(data.node, 1),
                        rate: calculateMoneyGainRate(data.stats.level, data.stats.ram + 1, data.stats.cores),
                    },
                    {
                        desc: 'core',
                        node: data.node,
                        purchase: () => ns.hacknet.upgradeCore(data.node, 1),
                        cost: ns.hacknet.getCoreUpgradeCost(data.node, 1),
                        rate: calculateMoneyGainRate(data.stats.level, data.stats.ram, data.stats.cores + 1),
                    },
                ]
                .filter(d => d.cost !== Infinity);
            });

        if (currentNodes < maxDesiredNodes && currentNodes < ns.hacknet.maxNumNodes()) {
            options.push({
                desc: 'node',
                node: currentNodes,
                purchase: () => ns.hacknet.purchaseNode(),
                cost: ns.hacknet.getPurchaseNodeCost(),
                // Always consider buying a new node the worst option
                // With a small fleet, as the cost of upgrading other nodes
                // gets higher, it will naturally start to grow
                rate: 0,
            })
        }

        if (options.length > 0) {
            ns.print(`Have ${options.length} options to try out`);
        } else {
            ns.print('No more options to try out');
            break;
        }

        const sortedOptions = options.sort((a, b) => {
            (a.rate/a.cost) - (b.rate/b.cost);
        });

        const currentMoney = ns.getServerMoneyAvailable('home');
        const selectedOption = sortedOptions.find((option) => option.cost <= currentMoney);

        if (selectedOption !== undefined) {
            selectedOption.purchase();
            ptoast(`Got another ${selectedOption.desc} for ${selectedOption.node}`);
            await ns.sleep(2000);
        } else {
            ns.print(`Couldn't purchase anything, so waiting for longer`);
            await ns.sleep(5000);
        }
    }
};
