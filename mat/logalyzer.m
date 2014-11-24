


M = csvread('trace.txt',1,0);
% #STEP, Collisions,QueueSize,TX Power, Speed
t = M(:,1);

figure(1);
hold on; grid on;
plot(t,M(:,5));
plot(t,M(:,4));
title('STAController Step Response')
legend('TX Power','Phymode Bitrate')

xlabel('Time [steps]')
    

    
fig2 = figure(2);
set(fig2, 'Position', [.1 .1 1000 400])
[ax,p1,p2] = plotyy(t,M(:,4),t,M(:,5),'plot','plot');
ylabel(ax(1),'tx power [mW]') % label left y-axis
ylabel(ax(2),'phymode speed [Mb/s]') % label right y-axis
xlabel(ax(1),'time [steps]') %label x-axis

legend('Phymode Bitrate','TX Power')

title('STAController Step Response')
legend('Phymode Bitrate','TX Power')

p1.LineWidth = 2;
p2.LineWidth = 2;

ax(1).YTick = [0:100:1000];
ax(2).YTick = [0:10:54];

grid on