
Infinity = Inf;
cd assignment03_sta017
% execute result scripts
% thrp_AC1;thrp_AC2;thrp_AC3;
offer_AC1;offer_AC2;offer_AC3;
total_thrp;
total_delay;
total_offer;

close all;

fig = figure(1)
hold on
grid on
%plot(result_thrp_AC1(:,1),result_thrp_AC1(:,6),'b-');hold on;
%plot(result_thrp_AC2(:,1),result_thrp_AC2(:,6),'k-');
%plot(result_thrp_AC3(:,1),result_thrp_AC3(:,6),'m-')

plot(result_total_thrp(:,1),result_total_thrp(:,6),'m-')
plot(result_total_offer(:,1),result_total_offer(:,6),'k-')

%plot(result_offer_AC1(:,1),result_offer_AC1(:,6),'b.');
%plot(result_offer_AC2(:,1),result_offer_AC2(:,6),'k.');
%plot(result_offer_AC3(:,1),result_offer_AC3(:,6),'m.')

legend('Total Throughput','Total Offer','Throughput AC3','Offer AC1','Offer AC2','Offer AC3');
xlabel('Time [ms]');
ylabel('Data [Mb/s]');

ylim([0,max(ylim)]);

offer  = result_total_offer(end,6)
goodput  = result_total_thrp(end,6)

cd ..