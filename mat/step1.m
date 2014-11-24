
Infinity = Inf;
fig = figure(1)

plot(thrp_06(:,1),thrp_06(:,6),'b-');hold on;
plot(thrp_18(:,1),thrp_18(:,6),'k-');
plot(thrp_54(:,1),thrp_54(:,6),'m-')

%plot(result_offer_AC1(:,1),result_offer_AC1(:,6),'b.');
%plot(result_offer_AC2(:,1),result_offer_AC2(:,6),'k.');
%plot(result_offer_AC3(:,1),result_offer_AC3(:,6),'m.')

legend('Throughput BPSK12','Throughput QPSK34','Throughput 64QAM34');
xlabel('Time [ms]');
ylabel('Data [Mb/s]');

ylim([0,max(ylim)]);

offer  = result_total_offer(end,6)
goodput  = thrp_06(end,6)
goodput  = thrp_18(end,6)
goodput  = thrp_54(end,6)

cd ..