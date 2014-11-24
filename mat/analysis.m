
M = csvread('../js/logs/snd_100cm_100B_delay.csv',1,0);
alpha = 0.9
[uh,sh,uc,si] = normfit(M(:,1),alpha)
y = M(:,1)
plot(1:length(y),y,'bx')

%% Read in data
pkgsizes = [1,10,50,100,150,197];
distances = [10,20,50,70,100,110,120];

prefix = '../js/logs/snd_';
mid = 'cm_';
postfix = 'B_delay.csv';
total_time = 63;
delay = []
thrp = []
A = []
i=1;
alpha = 0.9
for pkgsize=pkgsizes
    for distance=distances
        file = strcat(prefix,num2str(distance),mid,num2str(pkgsize),postfix)
        try
            M = csvread(file,1,0),
            [uh,sh,uc,si] = normfit(M(:,1),alpha),
            thrp = sum(M(:,2))/total_time,
            vec = [pkgsize distance uh thrp sh uc(1) uc(2) si(1) si(2)],
            A = [A; vec]
        catch
            vec = [pkgsize distance 0 0 0 0 0 0 0],
            A = [A; vec]
        end
    end
end

T = []
D = []
X = []
E = []
legendt = {}
legendd = {}

i=1
for pkgsize=pkgsizes
    
    filter = A(:, 1)== pkgsize;
    x = A(filter, 2)
    t = A(filter, 4)
    d = A(filter, 3)
    e = A(filter, 5)
    
    E = [ E e]
    X = [ X x]
    T = [ T t]
    D = [ D d]
    legendt{i} = sprintf('throughput %dB',pkgsize)
    legendd{i} = sprintf('delay %dB',pkgsize)
    i=i+1;
end



%% Plotting
l = length(pkgsizes)
colorSet = varycolor(l);
colorSet = [colorSet; colorSet];
set(groot,'defaultAxesColorOrder',colorSet);

fig2 = figure(1);

set(fig2, 'Position', [.1 .1 1000 400])
[ax,p1,p2] = plotyy(X,T,X,D,'plot','plot');

ylabel(ax(1),'throughput [B/s]') % label left y-axis
ylabel(ax(2),'delay [ms]') % label right y-axis
xlabel(ax(1),'distance [cm]') % label x-axis
%legend('throughput','delay');
legend(horzcat(legendt,legendd))
title(sprintf('Channel Characteristics for Different Package Sizes'))

%p1.LineWidth = 2;
%p1.LineStyle = ':';
%p1.Color = 'g';
%p2.LineWidth = 2;

for i=1:length(p1)
    p1(i).LineStyle = ':';
    p1(i).LineWidth = 2;
end

for i=1:length(p2)
    p2(i).LineWidth = 2;
end

axis(ax(1),[0,130,0,200])
axis(ax(2),[0,130,0,400])
%ax(1).YTick = [0:10:100];
%ax(2).YTick = [0:100:1000];

grid on
packetsize = A(:,1)
distance = A(:,2)
stddev = A(:,5)
table(packetsize,distance,stddev)

plotname = sprintf('del-thrp_plot.png');
hgexport(fig2,plotname,hgexport('factorystyle'),'Format','png');