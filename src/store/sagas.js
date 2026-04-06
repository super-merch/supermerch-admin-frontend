import { all, fork } from "redux-saga/effects";
//layout
import LayoutSaga from "./layouts/saga";
//Auth
import AuthSaga from "./auth/login/saga";
import ProfileSaga from "./auth/profile/saga";

export default function* rootSaga() {
  yield all([
    fork(LayoutSaga),
    fork(AuthSaga),
    fork(ProfileSaga),
  ]);
}
