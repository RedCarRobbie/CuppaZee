import * as React from 'react';
import { Text, View, Image, ScrollView, FlatList, TouchableHighlight } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { List, ActivityIndicator, FAB, Portal } from 'react-native-paper';
import request from '~store/request'
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ActivityOverview from './ActivityOverview'

var countup = (t) => (a, b) => {
  a[b[t]] = (a[b[t]] || 0) + 1;
  return a;
}

var count = (array, t) => {
  return Object.entries(array.reduce((a, b) => {
    a[b[t]] = (a[b[t]] || 0) + 1;
    return a;
  }, {})).sort((a, b) => b[1] - a[1])
}

var creatures = {
  'firepouchcreature': 'tuli',
  'waterpouchcreature': 'vesi',
  'earthpouchcreature': 'muru',
  'airpouchcreature': 'puffle',
  'mitmegupouchcreature': 'mitmegu',
  'unicorn': 'theunicorn',
  'fancyflatrob': 'coldflatrob',
  'fancy_flat_rob': 'coldflatrob',
  'fancyflatmatt': 'footyflatmatt',
  'fancy_flat_matt': 'footyflatmatt',
  'tempbouncer': 'expiring_specials_filter',
  'temp_bouncer': 'expiring_specials_filter'
}

var hostIcon = (icon) => {
  var host = icon.match(/\/([^\/\.]+?)_?(?:virtual|physical)?_?host\./)?.[1];
  if (!host) return null;
  return `https://munzee.global.ssl.fastly.net/images/pins/${creatures[host] ?? host}.png`;
}

function UserIcon({user_id,size}) { 
  return <Image source={{ uri: `https://munzee.global.ssl.fastly.net/images/avatars/ua${(user_id).toString(36)}.png` }} style={{ marginLeft: -(size-24)/2, marginTop: -(size-24)/2, height: size, width: size }} />
}

export default function UserActivityScreen() {
  var [FABOpen,setFABOpen] = React.useState(false);
  var logins = useSelector(i=>i.logins)
  var nav = useNavigation();
  var {t} = useTranslation();
  var theme = useSelector(i=>i.themes[i.theme]);
  var date = new Date(Date.now() - (5 * 60 * 60000));
  var dateString = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${(date.getUTCDate()).toString().padStart(2, '0')}`
  var navigation = useNavigation();
  var route = useRoute();
  var user_id = Number(route.params.userid);
  var dispatch = useDispatch();
  var users = useSelector(i => Object.keys(i.logins));
  var { data } = useSelector(i => i.request_data[`user/activity?user_id=${user_id}&day=${dateString}`] ?? {})
  var { data: userdata } = useSelector(i => i.request_data[`user/details?user_id=${user_id}`] ?? {})
  useFocusEffect(
    React.useCallback(() => {
      dispatch(request.add(`user/activity?user_id=${user_id}&day=${dateString}`))
      dispatch(request.add(`user/details?user_id=${user_id}`))
      return () => {
        dispatch(request.remove(`user/activity?user_id=${user_id}&day=${dateString}`))
        dispatch(request.remove(`user/details?user_id=${user_id}`))
      };
    }, [])
  );
  if (!data) return (
    <View style={{ flex: 1, alignContent: "center", justifyContent: "center", backgroundColor: theme.page_content.bg }}>
      <ActivityIndicator size="large" color={theme.page_content.fg} />
    </View>
  )
  function isRenovation(act) {
    return !!(act.pin.includes('/renovation.') && act.captured_at);
  }
  return <View style={{flex:1}}>
    <FlatList
      contentContainerStyle={{ width: 500, maxWidth: "100%", alignItems: "stretch", flexDirection: "column", alignSelf: "center", paddingBottom: 88 }}
      style={{ flex: 1, backgroundColor: theme.page_content.bg }}
      data={[
        <ActivityOverview user_id={user_id}/>,
        data.data.captures.filter(i=>isRenovation(i)).length?<View key="renovations" style={{ flexDirection: "column", width: "100%", alignItems: "center" }}>
          <View style={{ paddingLeft: 8, paddingRight: 8, borderRadius: 8 }}><Text style={{ color: theme.page_content.fg, fontSize: 20, fontWeight: "bold" }}>{data.data.captures.filter(i=>isRenovation(i)).length} Renovation{data.data.captures.filter(i=>isRenovation(i)).length !== 1 ? 's' : ''} - {data.data.captures.filter(i=>isRenovation(i)).reduce((a, b) => a + Number(b.points), 0)} Points</Text></View>
        </View>:1234,
        data.data.captures_on.filter(i=>isRenovation(i)).length?<View key="renons" style={{ flexDirection: "column", width: "100%", alignItems: "center" }}>
          <View style={{ paddingLeft: 8, paddingRight: 8, borderRadius: 8 }}><Text style={{ color: theme.page_content.fg, fontSize: 20, fontWeight: "bold" }}>{data.data.captures_on.filter(i=>isRenovation(i)).length} Renov-on{data.data.captures_on.filter(i=>isRenovation(i)).length !== 1 ? 's' : ''} - {data.data.captures_on.filter(i=>isRenovation(i)).reduce((a, b) => a + Number(b.points_for_creator), 0)} Points</Text></View>
        </View>:1234,
        ...data.data.captures,
        ...data.data.deploys,
        ...data.data.captures_on
      ].filter(i=>i!==1234).sort((a, b) => new Date(b.captured_at ?? b.deployed_at) - new Date(a.captured_at ?? a.deployed_at))}
      renderItem={({ item: act }) => !act.pin ? act : <View style={{ flexDirection: "row", paddingTop: 8, alignItems: "center" }}>
        <View style={{ padding: 4, paddingLeft: 8, position: "relative", alignContent: 'center', alignItems: "center", flexGrow: 0 }}>
          <View style={{ width: 60, justifyContent: 'center', flexDirection: "row", flexWrap: "wrap", flexGrow: 0 }}>
            <View style={{ paddingLeft: 8, paddingRight: 8, backgroundColor: act.points_for_creator ? theme.activity.capon.bg : (act.captured_at ? theme.activity.capture.bg : theme.activity.deploy.bg), borderRadius: 9.5 }}>
              <Text style={{ color: act.points_for_creator ? theme.activity.capon.fg : (act.captured_at ? theme.activity.capture.fg : theme.activity.deploy.fg), fontWeight: "bold" }}>{(act.points_for_creator ?? act.points) > 0 && '+'}{(Number(act.points_for_creator ?? act.points)) || t('activity:none')}</Text>
            </View>
          </View>
          <View style={{ position: 'relative' }}>
            <Image style={{ height: 32, width: 32 }} source={{ uri: act.pin }} />
            {hostIcon(act.pin) && <Image style={{ height: 24, width: 24, position: "absolute", right: -5, bottom: -5 }} source={{ uri: hostIcon(act.pin) }} />}
          </View>
        </View>
        <TouchableHighlight style={{ paddingLeft: 8, paddingRight: 8, flexGrow: 1, flexShrink: 1 }} onPress={() => { navigation.navigate('MunzeeDetails', { url: `/m/${!act.points_for_creator && act.captured_at ? act.username : userdata?.data?.username}/${act.code}` }) }} underlayColor="white">
          <View>
            <Text style={{color: theme.page_content.fg}}>{act.points_for_creator ? (isRenovation(act) ? `${act.username} Renovated your Motel` : t('activity:user_captured',{user:act.username})) : (act.captured_at ? (isRenovation(act) ? `You Renovated a Motel` : t('activity:you_captured')) : t('activity:you_deployed'))}</Text>
            {!isRenovation(act)&&<Text style={{ color: theme.page_content.fg, fontWeight: "bold" }}>{act.friendly_name}</Text>}
            {!isRenovation(act)&&<Text style={{ color: theme.page_content.fg, opacity: 0.8 }}>{act.points_for_creator ? t('activity:by_you') : (act.captured_at ? t('activity:by_user',{user:act.username}) : t('activity:by_you'))}</Text>}
          </View>
        </TouchableHighlight>
        <View style={{ padding: 8, flexGrow: 0, paddingLeft: 16, alignContent: 'center', position: "relative", alignItems: "flex-end" }}>
          <Text style={{ color: theme.page_content.fg, fontWeight: "bold" }}>{new Date(act.captured_at ?? act.deployed_at).getHours().toString().padStart(2, "0")}:{new Date(act.captured_at ?? act.deployed_at).getMinutes().toString().padStart(2, "0")}</Text>
          {/* <Image style={{ height: 32, width: 32 }} source={{ uri: act.pin }}/>
            {hostIcon(act.pin)&&<Image style={{ height: 24, width: 24, position: "absolute", right: 5, bottom: 5 }} source={{ uri: hostIcon(act.pin) }}/>} */}
        </View>
      </View>}
      keyExtractor={(item,index) => index.toString() ?? item.id ?? item.capture_id ?? item.captured_at ?? item.deployed_at}
    />
    {/* <Portal> */}
      <FAB.Group
        open={FABOpen}
        icon={()=><UserIcon size={56} user_id={user_id}/>}
        actions={Object.entries(logins).filter(i=>i[0]!=user_id).slice(0,5).map(i=>({ icon: ()=><UserIcon size={40} user_id={Number(i[0])}/>, label: i[1].username, onPress: () => {nav.popToTop();nav.replace('UserDetails',{userid:Number(i[0])})} }))}
        onStateChange={({open})=>setFABOpen(open)}
      />
    {/* </Portal> */}
  </View>
}