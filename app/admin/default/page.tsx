'use client';

import type { ApexOptions } from 'apexcharts';
import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import {
  MdAttachMoney,
  MdTrendingDown,
  MdAccountBalanceWallet,
  MdSavings,
} from 'react-icons/md';
import Card from 'components/card/Card';
import IconBox from 'components/icons/IconBox';
import MiniStatistics from 'components/card/MiniStatistics';
import BarChart from 'components/charts/BarChart';
import PieChart from 'components/charts/PieChart';
import TabAssistente from '@/components/tabs/TabAssistente';
import { useVisaoGeralData } from '@/lib/useVisaoGeralData';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function VisaoGeralHorizonPreview() {
  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();
  const { dados, gastosPorCat, loading } = useVisaoGeralData(mes, ano);

  const atual = dados.find((d) => d.isAtual);
  const totalGuardado = (atual?.ferias ?? 0) + (atual?.investimento ?? 0) + (atual?.planosFuturos ?? 0);

  const barOptions: ApexOptions = {
    chart: { toolbar: { show: false } },
    xaxis: {
      categories: dados.map((d) => d.label),
      labels: { style: { colors: '#A3AED0', fontSize: '12px', fontWeight: 500 } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
    grid: { show: false },
    colors: ['#4318FF', '#EFF4FB'],
    fill: { type: 'solid' },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '13px' },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
    tooltip: { theme: 'dark' },
  };
  const barData = [
    { name: 'Ganhos', data: dados.map((d) => Math.round(d.ganhos)) },
    { name: 'Gastos', data: dados.map((d) => Math.round(d.gastos)) },
  ];

  const pieOptions: ApexOptions = {
    labels: gastosPorCat.map((c) => c.nome),
    colors: gastosPorCat.map((c) => c.fill),
    legend: { show: false },
    dataLabels: { enabled: false },
    states: { hover: { filter: { type: 'none' } } },
    tooltip: { theme: 'dark' },
  };
  const pieData = gastosPorCat.map((c) => c.total);

  if (loading) {
    return (
      <Flex h="50vh" align="center" justify="center">
        <Text color="secondaryGray.600">Carregando...</Text>
      </Flex>
    );
  }

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="20px" mb="20px">
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg="#E9E3FF" icon={<Icon w="28px" h="28px" as={MdAttachMoney} color="#4318FF" />} />
          }
          name="Ganhos do mês"
          value={fmt(atual?.ganhos ?? 0)}
        />
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg="#FCE7E7" icon={<Icon w="28px" h="28px" as={MdTrendingDown} color="#E53E3E" />} />
          }
          name="Gastos do mês"
          value={fmt(atual?.gastos ?? 0)}
        />
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg="#E6FAF5" icon={<Icon w="28px" h="28px" as={MdAccountBalanceWallet} color="#01B574" />} />
          }
          name="Saldo do mês"
          value={fmt(atual?.saldo ?? 0)}
        />
        <MiniStatistics
          startContent={
            <IconBox w="56px" h="56px" bg="#FFF6DA" icon={<Icon w="28px" h="28px" as={MdSavings} color="#FFB547" />} />
          }
          name="Guardado do mês"
          value={fmt(totalGuardado)}
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="20px" mb="20px">
        <Card>
          <Text color="secondaryGray.900" fontSize="xl" fontWeight="700" mb="20px">
            Ganhos x Gastos — últimos 12 meses
          </Text>
          <Box h="280px">
            <BarChart chartData={barData} chartOptions={barOptions} />
          </Box>
        </Card>

        <Card>
          <Text color="secondaryGray.900" fontSize="xl" fontWeight="700" mb="20px">
            Gastos por categoria — mês atual
          </Text>
          {gastosPorCat.length > 0 ? (
            <>
              <Box h="220px">
                <PieChart chartData={pieData} chartOptions={pieOptions} />
              </Box>
              <Box mt="15px">
                {gastosPorCat.map((c) => (
                  <Flex key={c.nome} justify="space-between" align="center" py="4px">
                    <Flex align="center" gap="8px">
                      <Box w="8px" h="8px" borderRadius="50%" bg={c.fill} />
                      <Text fontSize="sm" color="secondaryGray.600">{c.nome}</Text>
                    </Flex>
                    <Text fontSize="sm" fontWeight="700" color="secondaryGray.900">{fmt(c.total)}</Text>
                  </Flex>
                ))}
              </Box>
            </>
          ) : (
            <Flex h="220px" align="center" justify="center">
              <Text color="secondaryGray.600" fontSize="sm">Sem gastos neste mês</Text>
            </Flex>
          )}
        </Card>
      </SimpleGrid>

      <Box mt="20px">
        <TabAssistente mes={mes} ano={ano} />
      </Box>
    </Box>
  );
}
