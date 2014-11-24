
folders = [2,4,8,16,20,21,22,23,24,25,28,32,50]

avg  = zeros(length(folders),4);
i=1;
for folder=folders
    path = strcat('cw_',num2str(folder))
    cd(path);
    total_thrp;
    total_delay;
    total_offer;
    avg(i,1) = folder;
    avg(i,2)  = result_total_offer(end,6);
    avg(i,3)  = result_total_thrp(end,6);
    avg(i,4) = result_total_delay(end,7);
    i=i+1;
    cd ..;
end

avg
fig1 = figure(1);
t=avg(:,1);
plot(t,avg(:,2),'g:',avg(:,1),avg(:,3),'b','LineWidth',2)
grid on
title('Channel Capacity')
legend('offer [Mb/s]','throughput [Mb/s]');
xlabel('number of stations')
ylabel('traffic [Mb/s]')



fig2 = figure(2);
set(fig2, 'Position', [.1 .1 1000 400])
[ax,p1,p2] = plotyy([t,avg(:,2)],[t,avg(:,3)],t,avg(:,4),'plot','plot');
ylabel(ax(1),'traffic [Mb/s]') % label left y-axis
ylabel(ax(2),'delay [ms]') % label right y-axis
xlabel(ax(1),'number of stations') % label x-axis
legend('offer [Mb/s]','throughput [Mb/s]','delay [ms]');
title('Channel Capacity')

p1(1).LineWidth = 2;
p1(2).LineWidth = 2;
p1(1).LineStyle = ':';
p1(1).Color = 'g';
p1(2).Color = 'b';
p2.LineWidth = 2;

ax(1).YTick = [0:10:50];
ax(2).YTick = [0:20:200];

grid on

hgexport(fig2,'channel_capacity_cw.png',hgexport('factorystyle'),'Format','png');
