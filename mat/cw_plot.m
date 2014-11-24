
clear;
d = dir();
isub = [d(:).isdir]; %# returns logical vector
folders = {d(isub).name}';
folders(ismember(folders,{'.','..'})) = [];
folders = natsort(folders);

sta = [2,4,8,16,20,21,22,23,24,25,28,32,50];
l = length(folders)
lsta = length(sta);
data = zeros(l,4,lsta);

for i=1:length(folders)
    f = folders{i}
    prefix{i} = f;
    cd(f);
    f = strcat(f,'_');
    A = cw_effects(f);
    
    data(i,1,:) = A(:,1);
    data(i,2,:) = A(:,2);
    data(i,3,:) = A(:,3);
    data(i,4,:) = A(:,4);
    
    cd ..;
end

%%
colorSet = varycolor(l+1);
colorSet = [colorSet; colorSet(2:end,:)];
set(groot,'defaultAxesColorOrder',colorSet);

fig1 = figure(1);
set(fig1, 'Position', [.1 .1 1000 400])

stas = zeros(lsta,1);
offer = zeros(lsta,1);

offer(:,1) = data(1,2,:);
stas(:,1) = data(1,1,:);

thrp = zeros(lsta,l+1);
delay = zeros(lsta,l);

thrp(:,1) = offer(:,1);
legs = prefix;
delayleg = prefix;
astas = stas;
for i=1:l
    thrp(:,i+1) = data(i,3,:);
    delay(:,i)  = data(i,4,:);
    astas = cat(2,astas,stas);
    legs{i} = strcat(legs{i},' throughput');
    delayleg{i} = strcat(delayleg{i},' delay');
end

bstas = astas;
astas = astas(:,end-1);

[ax,p1,p2] = plotyy(astas,thrp,astas,delay,'plot','plot');
ylabel(ax(1),'traffic [Mb/s]'); % label left y-axis
ylabel(ax(2),'delay [ms]'); % label right y-axis
xlabel(ax(1),'number of stations'); % label x-axis

legs = [{'offer [Mb/s]'},legs,delayleg];
legend(legs);


title('Channel Capacity');

p1(1).LineWidth = 2;
%p1(2).LineWidth = 2;
p1(1).LineStyle = ':';
p1(1).Color = 'g';
%p1(2).Color = 'b';
%p2(1).LineWidth = 2;

ax(1).YTick = [0:10:50];
ax(2).YTick = [0:20:200];

grid on

hgexport(fig1,'channel_capacity_cw.png',hgexport('factorystyle'),'Format','png');

